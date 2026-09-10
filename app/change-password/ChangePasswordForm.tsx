"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Password tidak dapat diubah saat ini.");
      setMessage(data.message ?? "Password berhasil diubah."); setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Password tidak dapat diubah saat ini."); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <section className="rs-card w-full border-white/10 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="rs-eyebrow">Account Security</p>
          <h1 className="rs-title mt-3 text-3xl">Ubah password</h1>
          <p className="rs-subtitle mt-2">Ganti password akun Anda tanpa melalui proses forgot-password.</p>
          <form onSubmit={submit} className="rs-form mt-7">
            <label className="block text-sm font-bold">Password Saat Ini<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rs-input" /></label>
            <label className="block text-sm font-bold">Password Baru<input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rs-input" /><span className="rs-form-help">Minimal 8 karakter.</span></label>
            <label className="block text-sm font-bold">Konfirmasi Password Baru<input required minLength={8} type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rs-input" /></label>
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
            {error && <p role="alert" className="rs-form-error">{error}</p>}
            <button disabled={busy} className="rs-button rs-button-primary w-full">{busy ? "Memproses..." : "Ubah Password"}</button>
          </form>
          <Link href="/profile" className="rs-button rs-button-ghost mt-4 w-full">Kembali ke profile</Link>
        </section>
      </div>
    </main>
  );
}
