 "use client";

import { useMemo, useState } from "react";

type Candidate = {
  id: string; domain: string; subdomain: string | null; indicator: string | null; text: string;
};

const DIMS = ["R","I","A","S","E","C"];

export default function RiasecHumanReviewWorkspace({ candidates }: { candidates: Candidate[] }) {
  const [decisions, setDecisions] = useState<Record<string, "APPROVE"|"RESERVE"|"REJECT"|"">>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [filter, setFilter] = useState("ALL");

  const counts = useMemo(() => Object.fromEntries(DIMS.map(d => [
    d, candidates.filter(q => q.domain === d && decisions[q.id] === "APPROVE").length
  ])), [candidates, decisions]);

  const approved = Object.values(decisions).filter(v => v === "APPROVE").length;
  const visible = filter === "ALL" ? candidates : candidates.filter(q => q.domain === filter);

  function setDecision(id: string, value: "APPROVE"|"RESERVE"|"REJECT") {
    setDecisions(prev => ({ ...prev, [id]: value }));
  }

  function download() {
    const payload = {
      schemaVersion: "RIASEC_HUMAN_REVIEW_DECISION_V1",
      assessmentType: "riasec",
      candidateCount: 84,
      requiredApprovedCount: 60,
      requiredPerDimension: 10,
      decisions: candidates.map(q => ({
        id: q.id,
        domain: q.domain,
        decision: decisions[q.id] ?? "",
        reviewerNote: notes[q.id] ?? "",
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">ReadyScore Human Review</p>
              <h1 className="mt-1 text-2xl font-black">RIASEC — 84 Candidate Review</h1>
              <p className="mt-1 text-sm text-slate-500">Tidak ada database mutation. Keputusan diekspor sebagai review package.</p>
            </div>
            <button onClick={download} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Export Review JSON</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Approved: {approved}/60</span>
            {DIMS.map(d => <span key={d} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{d}: {counts[d]}/10</span>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["ALL", ...DIMS].map(d => (
              <button key={d} onClick={() => setFilter(d)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === d ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>{d}</button>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-3 px-5 py-6">
        {visible.map((q, index) => (
          <section key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl">
                <div className="flex flex-wrap gap-2">
                  <span className="font-mono text-xs font-bold">{q.id}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{q.domain}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{q.subdomain ?? "—"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{q.indicator ?? "—"}</span>
                </div>
                <p className="mt-3 text-base font-semibold leading-7">{q.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {(["APPROVE","RESERVE","REJECT"] as const).map(v => (
                  <button key={v} onClick={() => setDecision(q.id, v)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${decisions[q.id] === v ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>{v}</button>
                ))}
              </div>
            </div>
            <textarea
              value={notes[q.id] ?? ""}
              onChange={e => setNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Reviewer note (optional)"
              className="mt-4 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
            />
          </section>
        ))}
        {!visible.length && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">No candidates.</p>}
      </div>
    </main>
  );
}
