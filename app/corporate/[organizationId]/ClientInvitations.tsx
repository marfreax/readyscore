"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type InvitationRow = {
  id: string;
  email: string;
  category: string;
  jobTitle: string | null;
  department: string | null;
  status: string;
  expiresAt: string;
  sentAt: string | null;
  openedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  resultEmailStatus: string;
  participant: { id: string; fullName: string; category: string } | null;
  assessmentConfigurationVersion: { questionCount: number };
  questionPackageVersion: { timeLimitSeconds: number };
};
type ParticipantRow = {
  id: string; fullName: string | null; email: string; whatsapp: string | null;
  category: "CANDIDATE" | "EMPLOYEE" | "ALUMNI";
  latestDisc: null | { invitationId: string; completedAt: string | null; primaryPattern: "D" | "I" | "S" | "C" | null; secondaryPattern: "D" | "I" | "S" | "C" | null; scores: Record<"D" | "I" | "S" | "C", number> };
};

export default function ClientInvitations({ organizationId, role, view }: { organizationId: string; role: "ADMIN" | "VIEWER"; view: "overview" | "people" | "invitations" }) {
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantFilter, setParticipantFilter] = useState<"ALL" | ParticipantRow["category"]>("ALL");
  const [dominantFilter, setDominantFilter] = useState<"ALL" | "D" | "I" | "S" | "C">("ALL");
  const [participantSearch, setParticipantSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"CANDIDATE" | "EMPLOYEE">("CANDIDATE");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const endpoint = `/api/client/${encodeURIComponent(organizationId)}/invitations`;
  const participantsEndpoint = `/api/client/${encodeURIComponent(organizationId)}/participants`;

  const load = useCallback(async () => {
    if (view !== "people") {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Data invitation tidak dapat dimuat.");
      setRows(data.invitations);
    }
    if (view !== "invitations") {
      const participantResponse = await fetch(participantsEndpoint, { cache: "no-store" });
      const participantData = await participantResponse.json();
      if (!participantResponse.ok || !participantData.ok) throw new Error("Daftar peserta tidak dapat dimuat.");
      setParticipants(participantData.participants);
    }
  }, [endpoint, participantsEndpoint, view]);

  async function changeCategory(participant: ParticipantRow, nextCategory: ParticipantRow["category"]) {
    const label = nextCategory === "EMPLOYEE" ? "karyawan aktif" : "alumni";
    if (!window.confirm(`Pindahkan ${participant.fullName || participant.email} menjadi ${label}?`)) return;
    setError("");
    try {
      const response = await fetch(participantsEndpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ participantId: participant.id, category: nextCategory }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error?.code === "CLIENT_PARTICIPANT_TRANSITION_NOT_ALLOWED" ? "Perubahan status ini tidak tersedia." : "Status peserta belum dapat diubah.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kategori peserta belum dapat diubah."); }
  }

  async function invitationAction(row: InvitationRow, action: "RESEND" | "REVOKE" | "RETRY_RESULT_EMAIL") {
    if (action === "REVOKE" && !window.confirm(`Batalkan undangan untuk ${row.email}? Tautan lama tidak bisa digunakan lagi.`)) return;
    setActionBusy(`${row.id}:${action}`); setError(""); setCreatedLink("");
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(row.id)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error?.code === "CLIENT_INVITATION_CANNOT_RESEND" ? "Undangan ini tidak dapat dikirim ulang karena assessment sudah berjalan atau selesai." : "Aksi belum berhasil. Muat ulang daftar lalu coba lagi.");
      if (data.invitation?.inviteUrl) setCreatedLink(data.invitation.inviteUrl);
      if (action === "RETRY_RESULT_EMAIL" && data.resultEmailStatus === "FAILED") setError("Pengiriman ulang email hasil masih gagal. Coba lagi setelah konfigurasi email diperiksa.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Aksi belum berhasil."); }
    finally { setActionBusy(""); }
  }

  useEffect(() => {
    let active = true;
    load().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Data invitation tidak dapat dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedLink("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, category, jobTitle, department }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error?.code === "CLIENT_DISC_PACKAGE_NOT_READY" ? "Paket DISC Corporate 100 soal belum siap pada konfigurasi runtime." : data?.error?.code === "CORPORATE_CREDIT_INSUFFICIENT" ? "Saldo kredit DISC tidak mencukupi. Beli paket kredit terlebih dahulu." : "Invitation belum dapat dibuat.");
      if (data.invitation.inviteUrl) setCreatedLink(data.invitation.inviteUrl);
      setEmail(""); setJobTitle(""); setDepartment("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation belum dapat dibuat.");
    } finally {
      setBusy(false);
    }
  }

  const normalizedSearch = participantSearch.trim().toLocaleLowerCase("id-ID");
  const filteredParticipants = participants.filter((participant) => {
    const matchesCategory = participantFilter === "ALL" || participant.category === participantFilter;
    const matchesDominant = dominantFilter === "ALL" || participant.latestDisc?.primaryPattern === dominantFilter;
    const matchesSearch = !normalizedSearch || `${participant.fullName ?? ""} ${participant.email} ${participant.whatsapp ?? ""}`.toLocaleLowerCase("id-ID").includes(normalizedSearch);
    return matchesCategory && matchesDominant && matchesSearch;
  });
  const completedReports = rows.filter((row) => row.status === "COMPLETED").length;
  const peopleByCategory = { EMPLOYEE: participants.filter((row) => row.category === "EMPLOYEE").length, CANDIDATE: participants.filter((row) => row.category === "CANDIDATE").length, ALUMNI: participants.filter((row) => row.category === "ALUMNI").length };

  return <div className="space-y-6">
    {view === "overview" && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Karyawan aktif", peopleByCategory.EMPLOYEE], ["Candidate", peopleByCategory.CANDIDATE], ["Alumni", peopleByCategory.ALUMNI], ["Laporan DISC tersedia", completedReports]].map(([label, value]) => <article key={label} className="rs-card p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></article>)}</section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href={`/corporate/${encodeURIComponent(organizationId)}/people`} className="rs-card p-5 transition hover:border-indigo-300"><p className="rs-eyebrow">Direktori</p><h3 className="mt-2 font-black">Kelola orang</h3><p className="mt-1 text-sm text-slate-600">Cari peserta, lihat skor DISC, dan perbarui status kerja.</p><span className="mt-4 inline-block text-sm font-bold text-indigo-700">Buka direktori →</span></Link>
        <Link href={`/corporate/${encodeURIComponent(organizationId)}/invitations`} className="rs-card p-5 transition hover:border-indigo-300"><p className="rs-eyebrow">Undangan</p><h3 className="mt-2 font-black">Kelola invitation DISC</h3><p className="mt-1 text-sm text-slate-600">Undang karyawan atau candidate dan pantau progresnya.</p><span className="mt-4 inline-block text-sm font-bold text-indigo-700">Buka undangan →</span></Link>
        <Link href={`/corporate/${encodeURIComponent(organizationId)}/reports`} className="rs-card p-5 transition hover:border-indigo-300"><p className="rs-eyebrow">Laporan</p><h3 className="mt-2 font-black">Lihat laporan DISC</h3><p className="mt-1 text-sm text-slate-600">Tinjau hasil peserta yang telah menyelesaikan test.</p><span className="mt-4 inline-block text-sm font-bold text-indigo-700">Buka laporan →</span></Link>
      </section>
      <section className="rs-card p-6"><div className="flex items-center justify-between gap-4"><div><p className="rs-eyebrow">Aktivitas terbaru</p><h3 className="mt-2 text-lg font-black">Invitation & assessment</h3></div><Link href={`/corporate/${encodeURIComponent(organizationId)}/invitations`} className="text-sm font-bold text-indigo-700">Semua undangan →</Link></div>{loading ? <p className="mt-4 text-sm text-slate-500">Memuat aktivitas...</p> : rows.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada aktivitas. Kirim invitation pertama dari menu Undangan DISC.</p> : <div className="mt-4 divide-y divide-slate-100">{rows.slice(0, 5).map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold">{row.participant?.fullName ?? row.email}</p><p className="mt-1 text-xs text-slate-500">{row.category === "EMPLOYEE" ? "Karyawan" : row.category === "ALUMNI" ? "Alumni" : "Candidate"} · {new Date(row.createdAt).toLocaleDateString("id-ID")}</p></div><StatusBadge status={row.status} /></div>)}</div>}</section>
    </>}
    {view === "people" && <section id="people" className="rs-card scroll-mt-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="rs-eyebrow">Direktori</p><h2 className="mt-2 text-xl font-black">Karyawan, candidate & alumni</h2><p className="mt-1 text-sm text-slate-500">Lihat profil dan pola DISC, lalu perbarui status kerja saat berubah.</p></div><div className="flex flex-wrap gap-2">{([["ALL", "Semua"], ["EMPLOYEE", "Karyawan"], ["CANDIDATE", "Candidate"], ["ALUMNI", "Alumni"]] as const).map(([key, label]) => <button key={key} onClick={() => setParticipantFilter(key)} aria-pressed={participantFilter === key} className={`rounded-full px-3 py-2 text-xs font-bold ${participantFilter === key ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"}`}>{label} <span className="opacity-75">{key === "ALL" ? participants.length : peopleByCategory[key]}</span></button>)}</div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="text-xs font-bold text-slate-600">Cari orang<input type="search" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} placeholder="Nama, email, WhatsApp" className="rs-input mt-1.5 w-full" /></label>
        <label className="text-xs font-bold text-slate-600">Pola dominan<select value={dominantFilter} onChange={(event) => setDominantFilter(event.target.value as typeof dominantFilter)} className="rs-input mt-1.5 w-full"><option value="ALL">Semua pola</option><option value="D">D · Dominance</option><option value="I">I · Influence</option><option value="S">S · Steadiness</option><option value="C">C · Conscientiousness</option></select></label>
      </div>
      {loading ? <p className="mt-5 text-sm text-slate-500">Memuat daftar peserta...</p> : filteredParticipants.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Tidak ada orang yang cocok dengan filter ini.</p> : <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Orang</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Pola dominan</th><th title="Dominance" className="px-3 py-3">D · Dominance</th><th title="Influence" className="px-3 py-3">I · Influence</th><th title="Steadiness" className="px-3 py-3">S · Steadiness</th><th title="Conscientiousness" className="px-3 py-3">C · Conscientiousness</th><th className="px-3 py-3">Assessment</th><th className="px-4 py-3">Tindakan</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredParticipants.map((participant) => <tr key={participant.id} className="align-middle"><td className="px-4 py-3"><p className="font-bold text-slate-900">{participant.fullName || participant.email}</p><p className="mt-0.5 text-xs text-slate-500">{participant.email}{participant.whatsapp ? ` · ${participant.whatsapp}` : ""}</p></td><td className="px-3 py-3"><CategoryBadge category={participant.category} /></td><td className="px-3 py-3">{participant.latestDisc?.primaryPattern ? <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-800">{participant.latestDisc.primaryPattern}{participant.latestDisc.secondaryPattern ? ` · ${participant.latestDisc.secondaryPattern}` : ""}</span> : <span className="text-xs text-slate-400">Belum ada</span>}</td>{(["D", "I", "S", "C"] as const).map((dimension) => <td key={dimension} className="px-3 py-3 font-semibold tabular-nums">{participant.latestDisc ? `${Math.round(participant.latestDisc.scores[dimension])}%` : <span className="text-slate-300">—</span>}</td>)}<td className="px-3 py-3">{participant.latestDisc ? <Link href={`/corporate/${encodeURIComponent(organizationId)}/results/${encodeURIComponent(participant.latestDisc.invitationId)}`} className="font-bold text-indigo-700 hover:underline">Lihat laporan</Link> : <span className="text-xs text-slate-400">Belum selesai</span>}</td><td className="px-4 py-3">{role === "ADMIN" && participant.category === "CANDIDATE" ? <button onClick={() => changeCategory(participant, "EMPLOYEE")} className="whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">Jadikan karyawan</button> : role === "ADMIN" && participant.category === "EMPLOYEE" ? <button onClick={() => changeCategory(participant, "ALUMNI")} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Pindahkan ke alumni</button> : <span className="text-xs text-slate-400">—</span>}</td></tr>)}</tbody></table></div>}
      <p className="mt-3 text-xs leading-5 text-slate-400">Skor menunjukkan proporsi pilihan relatif dalam assessment tersebut; gunakan sebagai bahan diskusi, bukan ukuran kemampuan atau keputusan otomatis.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </section>}
    {view === "invitations" && <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    {role === "ADMIN" && <section id="invitations" className="rs-card scroll-mt-6 p-6">
      <p className="rs-eyebrow">Invitation DISC</p>
      <h2 className="mt-2 text-xl font-black">Undang peserta</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Undangan berlaku 7 hari. Assessment DISC Corporate berisi 100 soal dengan batas waktu 30 menit. Kredit dialokasikan saat undangan dibuat dan baru terpakai ketika peserta memulai tes.</p>
      <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Versi pilot deskriptif. Hasil membantu diskusi pengembangan dan tidak menjadi keputusan seleksi otomatis atau satu-satunya dasar penerimaan.</p>
      <form onSubmit={create} className="mt-5 space-y-4">
        <label className="block text-sm font-bold">Email peserta<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rs-input mt-2 w-full" /></label>
        <label className="block text-sm font-bold">Kategori peserta<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="rs-input mt-2 w-full"><option value="CANDIDATE">Candidate</option><option value="EMPLOYEE">Karyawan</option></select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">Posisi (opsional)<input maxLength={120} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className="rs-input mt-2 w-full" /></label>
          <label className="block text-sm font-bold">Departemen (opsional)<input maxLength={120} value={department} onChange={(event) => setDepartment(event.target.value)} className="rs-input mt-2 w-full" /></label>
        </div>
        {createdLink && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-bold">Email belum terkirim. Simpan tautan ini dan bagikan hanya kepada peserta.</p><a className="mt-2 block break-all underline" href={createdLink}>{createdLink}</a></div>}
        {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        <button disabled={busy} className="rs-button rs-button-primary w-full justify-center">{busy ? "Mengirim..." : "Kirim invitation"}</button>
      </form>
    </section>}

    <section id={role === "VIEWER" ? "invitations" : undefined} className="rs-card p-6">
      <div className="flex items-end justify-between gap-4"><div><p className="rs-eyebrow">Aktivitas</p><h2 className="mt-2 text-xl font-black">Invitation & assessment</h2></div><span className="text-sm text-slate-500">{rows.length} terbaru</span></div>
      {loading ? <p className="mt-5 text-sm text-slate-500">Memuat invitation...</p> : rows.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada invitation pada organisasi ini.</p> :
        <div className="mt-5 space-y-3">{rows.map((row) => <article key={row.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{row.participant?.fullName ?? row.email}</p><p className="mt-1 text-xs text-slate-500">{row.category === "CANDIDATE" ? "Candidate" : row.category === "EMPLOYEE" ? "Karyawan" : "Alumni"}{row.jobTitle ? ` · ${row.jobTitle}` : ""}{row.department ? ` · ${row.department}` : ""}</p></div><StatusBadge status={row.status} /></div>
          <p className="mt-3 text-xs text-slate-500">DISC · {row.assessmentConfigurationVersion.questionCount} soal · {Math.ceil(row.questionPackageVersion.timeLimitSeconds / 60)} menit</p>
          <p className="mt-1 text-xs text-slate-500">Email hasil: {row.resultEmailStatus === "SENT" ? "terkirim" : row.resultEmailStatus === "FAILED" ? "gagal" : row.status === "COMPLETED" ? "menunggu" : "belum dikirim"}</p>
          <p className="mt-1 text-[11px] text-slate-400">Dibuat {new Date(row.createdAt).toLocaleDateString("id-ID")} · Berlaku sampai {new Date(row.expiresAt).toLocaleDateString("id-ID")}</p>
          {row.status === "COMPLETED" && <Link href={`/corporate/${encodeURIComponent(organizationId)}/results/${encodeURIComponent(row.id)}`} className="mt-3 inline-flex text-sm font-bold text-indigo-700">Lihat hasil DISC →</Link>}
          {role === "ADMIN" && <div className="mt-3 flex flex-wrap gap-2">{["SENT", "OPENED", "EXPIRED", "DELIVERY_FAILED"].includes(row.status) && <button type="button" disabled={Boolean(actionBusy)} onClick={() => invitationAction(row, "RESEND")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">{actionBusy === `${row.id}:RESEND` ? "Mengirim..." : "Kirim ulang undangan"}</button>}{["DRAFT", "SENT", "OPENED", "DELIVERY_FAILED"].includes(row.status) && <button type="button" disabled={Boolean(actionBusy)} onClick={() => invitationAction(row, "REVOKE")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">{actionBusy === `${row.id}:REVOKE` ? "Membatalkan..." : "Batalkan"}</button>}{row.status === "COMPLETED" && row.resultEmailStatus === "FAILED" && <button type="button" disabled={Boolean(actionBusy)} onClick={() => invitationAction(row, "RETRY_RESULT_EMAIL")} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50">{actionBusy === `${row.id}:RETRY_RESULT_EMAIL` ? "Mengirim hasil..." : "Kirim ulang email hasil"}</button>}</div>}
        </article>)}</div>}
      {error && role !== "ADMIN" && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </section>
    </div>}
  </div>;
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = { DRAFT: "Draft", SENT: "Terkirim", OPENED: "Dibuka", IN_PROGRESS: "Sedang dikerjakan", COMPLETED: "Selesai", EXPIRED: "Kedaluwarsa", REVOKED: "Dibatalkan", DELIVERY_FAILED: "Email gagal" };
  const tone = status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : status === "DELIVERY_FAILED" || status === "EXPIRED" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label[status] ?? status}</span>;
}

function CategoryBadge({ category }: { category: ParticipantRow["category"] }) {
  const style = category === "EMPLOYEE" ? "bg-emerald-50 text-emerald-800" : category === "ALUMNI" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800";
  const label = category === "EMPLOYEE" ? "Karyawan aktif" : category === "ALUMNI" ? "Alumni" : "Candidate";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>;
}
