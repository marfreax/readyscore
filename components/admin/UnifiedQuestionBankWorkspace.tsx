 "use client";

import { useEffect, useMemo, useState } from "react";

type Q = {
  id: string; questionId: string; questionVersionId: string; version: string;
  testTypeCode: string | null; testTypeName: string | null;
  domain: string; subdomain: string | null; indicator: string | null; text: string;
  difficulty: string; status: string; mappingStatus: string;
};
type T = { id: string; code: string; name: string; category: string; runtimeKey: string | null };
type Stats = { total:number; draft:number; validated:number; mapped:number; mappingReview:number; partial:number; approved:number; published:number; eligible:number; questionBankVersion:string; };

const empty = { code:"", text:"", testTypeId:"", domain:"", subdomain:"", indicator:"", difficulty:"UNSPECIFIED" };

export default function UnifiedQuestionBankWorkspace({
  initialQuestions, initialStats, testTypes,
}: { initialQuestions: Q[]; initialStats: Stats; testTypes: T[] }) {
  const [questions,setQuestions]=useState(initialQuestions);
  const [stats,setStats]=useState(initialStats);
  const [search,setSearch]=useState("");
  const [testFilter,setTestFilter]=useState("ALL");
  const [status,setStatus]=useState("ALL");
  const [selected,setSelected]=useState<Q|null>(null);
  const [mode,setMode]=useState<"create"|"edit"|null>(null);
  const [form,setForm]=useState({...empty});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const visible=useMemo(()=>questions.filter(q=>
    (testFilter==="ALL"||q.testTypeCode===testFilter) &&
    (status==="ALL"||q.status===status||q.mappingStatus===status) &&
    (!search||`${q.id} ${q.text} ${q.domain} ${q.subdomain??""} ${q.indicator??""}`.toLowerCase().includes(search.toLowerCase()))
  ),[questions,testFilter,status,search]);

  async function refresh() {
    const r=await fetch("/api/admin/question-bank",{cache:"no-store"});
    const j=await r.json(); if(j.ok){setQuestions(j.questions);setStats(j.stats)}
  }
  async function act(payload: Record<string,unknown>) {
    setBusy(true); setMessage("");
    try {
      const r=await fetch("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error?.code||"Action failed");
      setMessage("Saved.");
      await refresh();
      if(j.question) setSelected(j.question);
      setMode(null);
    } catch(e) { setMessage(e instanceof Error?e.message:"Action failed"); }
    finally { setBusy(false); }
  }
  function openEdit(q:Q) {
    setSelected(q); setMode("edit");
    setForm({code:q.id,text:q.text,testTypeId:testTypes.find(t=>t.code===q.testTypeCode)?.id??"",domain:q.domain,subdomain:q.subdomain??"",indicator:q.indicator??"",difficulty:q.difficulty});
  }
  function openCreate() { setSelected(null);setMode("create");setForm({...empty,testTypeId:testTypes[0]?.id??""}); }

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[["Total",stats.total],["Draft",stats.draft],["Mapped",stats.mapped],["Approved",stats.approved],["Published",stats.published]].map(([l,v])=>
        <div key={String(l)} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold text-slate-500">{l}</p><p className="mt-2 text-2xl font-black">{v}</p></div>)}
    </div>

    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search code, question, taxonomy..." className="min-w-[260px] flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-indigo-500"/>
        <select value={testFilter} onChange={e=>setTestFilter(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm">
          <option value="ALL">All tests</option>{testTypes.map(t=><option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm">
          {["ALL","DRAFT","MAPPED","APPROVED","PUBLISHED","ARCHIVED","REVIEW_REQUIRED"].map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={openCreate} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">+ New question</button>
      </div>
      <div className="mt-4 text-xs text-slate-500">{visible.length} questions shown · {stats.questionBankVersion}</div>

      <div className="mt-4 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr>
            <th className="px-4 py-3">Code</th><th className="px-4 py-3">Test</th><th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Domain</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{visible.map(q=><tr key={q.questionVersionId} className="align-top hover:bg-slate-50">
            <td className="px-4 py-4 font-mono text-xs font-bold">{q.id}</td>
            <td className="px-4 py-4 font-bold">{q.testTypeCode??"—"}</td>
            <td className="px-4 py-4 font-mono text-xs">{q.version}</td>
            <td className="px-4 py-4 text-xs">{q.domain}<br/><span className="text-slate-500">{q.subdomain??"—"} · {q.indicator??"—"}</span></td>
            <td className="max-w-lg px-4 py-4 leading-6">{q.text}</td>
            <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{q.status}</span><div className="mt-2 text-[11px] text-indigo-700">{q.mappingStatus}</div></td>
            <td className="px-4 py-4"><div className="flex flex-wrap gap-2">
              <button onClick={()=>setSelected(q)} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">Inspect</button>
              <button onClick={()=>openEdit(q)} disabled={q.status==="ARCHIVED"} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">Edit / version</button>
              <button onClick={()=>{const c=prompt("New logical question code:",`${q.id}-COPY`);if(c)act({action:"DUPLICATE",questionId:q.questionId,newCode:c})}} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">Duplicate</button>
              {q.mappingStatus==="MAPPED"&&<button onClick={()=>act({action:"APPROVE_MAPPING",questionId:q.questionId})} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">Approve mapping</button>}
              {q.status==="DRAFT"&&q.mappingStatus==="APPROVED"&&<button onClick={()=>act({action:"APPROVE",questionId:q.questionId})} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">Approve</button>}
              {q.status==="APPROVED"&&q.mappingStatus==="APPROVED"&&<button onClick={()=>act({action:"ACTIVATE",questionId:q.questionId})} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white">Activate</button>}
              {q.status!=="ARCHIVED"&&<button onClick={()=>act({action:"ARCHIVE",questionId:q.questionId})} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">Archive</button>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>

    {selected&&<div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Question inspector</p><h2 className="mt-1 text-xl font-black">{selected.id} · {selected.version}</h2></div><button onClick={()=>setSelected(null)} className="rounded-lg border px-3 py-1.5 text-xs font-bold">Close</button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-3 text-sm"><div><b>Logical ID</b><p className="font-mono">{selected.questionId}</p></div><div><b>Version ID</b><p className="font-mono break-all">{selected.questionVersionId}</p></div><div><b>Test</b><p>{selected.testTypeCode??"—"} — {selected.testTypeName??"—"}</p></div></div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-5 leading-7">{selected.text}</div>
      <p className="mt-4 text-xs text-slate-500">Historical assessment-facing versions remain immutable. Edit creates a new version.</p>
    </div>}

    {mode&&<div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black">{mode==="create"?"Create logical question":"Create new question version"}</h2><button onClick={()=>setMode(null)} className="text-sm font-bold">Cancel</button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {mode==="create"&&<label className="text-sm font-bold">Question code<input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-mono font-normal"/></label>}
        {mode==="create"&&<label className="text-sm font-bold">Test type<select value={form.testTypeId} onChange={e=>setForm({...form,testTypeId:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal">{testTypes.map(t=><option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}</select></label>}
        <label className="text-sm font-bold md:col-span-2">Question text<textarea rows={4} value={form.text} onChange={e=>setForm({...form,text:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
        <label className="text-sm font-bold">Domain<input value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
        <label className="text-sm font-bold">Subdomain<input value={form.subdomain} onChange={e=>setForm({...form,subdomain:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
        <label className="text-sm font-bold">Indicator<input value={form.indicator} onChange={e=>setForm({...form,indicator:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
        <label className="text-sm font-bold">Difficulty<select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"><option>UNSPECIFIED</option><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></label>
      </div>
      <div className="mt-5 flex items-center gap-3"><button disabled={busy} onClick={()=>mode==="create"?act({action:"CREATE",input:form}):act({action:"EDIT",questionId:selected?.questionId,input:form})} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?"Saving...":"Save"}</button>{message&&<span className="text-sm font-bold text-slate-600">{message}</span>}</div>
    </div>}
  </div>;
}
