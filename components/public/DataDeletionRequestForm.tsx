"use client";

import { FormEvent, useState } from "react";

export function DataDeletionRequestForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/privacy/data-deletion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), reason: form.get("reason") }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code || "DATA_DELETION_REQUEST_FAILED");
      setMessage(body.message); (event.target as HTMLFormElement).reset();
    } catch (e) { setError(e instanceof Error ? e.message : "DATA_DELETION_REQUEST_FAILED"); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
    <h3 className="text-lg font-black text-slate-900">Submit deletion request</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">Gunakan email yang terkait dengan akun ReadyScore. Kami akan melakukan verifikasi kepemilikan sebelum memproses penghapusan.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">Nama<input name="name" maxLength={200} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500" placeholder="Nama Anda" /></label>
      <label className="text-sm font-bold text-slate-700">Email <span className="text-rose-500">*</span><input name="email" type="email" required maxLength={320} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500" placeholder="email@contoh.com" /></label>
    </div>
    <label className="mt-4 block text-sm font-bold text-slate-700">Catatan (opsional)<textarea name="reason" maxLength={1000} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500" placeholder="Jelaskan data atau akun yang ingin dihapus jika diperlukan." /></label>
    {message && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
    {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">Permintaan belum dapat diproses. Silakan coba lagi.</p>}
    <button disabled={busy} className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Mengirim…" : "Kirim Permintaan Penghapusan"}</button>
  </form>;
}
