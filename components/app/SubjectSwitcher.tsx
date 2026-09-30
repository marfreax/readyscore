"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSubjectSwitchFallback } from "../../lib/subjects/navigation";

type Subject = { id: string; name: string; type: "OWNER" | "CHILD" };

export default function SubjectSwitcher() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeId, setActiveId] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function load() {
    const response = await fetch("/api/subjects", { cache: "no-store" });
    const data = await response.json();
    if (data.ok) { setSubjects(data.subjects ?? []); setActiveId(data.activeSubjectId ?? ""); }
  }
  useEffect(() => { void load(); }, []);

  async function select(id: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/subjects/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: id }) });
      if (response.ok) {
        setActiveId(id);
        const fallback = getSubjectSwitchFallback(pathname);
        if (fallback) router.replace(fallback);
        else router.refresh();
      }
    } finally { setBusy(false); }
  }

  async function addChild() {
    const name = window.prompt("Nama profil tambahan:");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      const data = await response.json();
      if (response.ok) { await select(data.subject.id); }
      else window.alert(data.error?.message ?? "Subject gagal dibuat.");
    } finally { setBusy(false); }
  }

  if (subjects.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2">
    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">Active profile</span>
    <select aria-label="Pilih peserta aktif" disabled={busy} value={activeId} onChange={(event) => void select(event.target.value)} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 outline-none">
      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.type === "OWNER" ? " — Utama" : " — Tambahan"}</option>)}
    </select>
    <button type="button" disabled={busy} onClick={() => void addChild()} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">+ Tambah Profil</button>
  </div>;
}
