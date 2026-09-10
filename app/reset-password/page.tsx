"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "PASSWORD_RESET_FAILED");
      setMessage(data.message ?? "Password berhasil diubah. Silakan login kembali.");
      setPassword(""); setConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password tidak dapat diubah saat ini.");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <section className="rs-card w-full border-white/10 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="rs-eyebrow">ReadyScore</p>
          <h1 className="rs-title mt-3 text-3xl">Buat password baru</h1>
          <p className="rs-subtitle mt-2">Masukkan password baru untuk mengamankan kembali akun Anda.</p>
          <form onSubmit={submit} className="rs-form mt-7">
            <label className="block text-sm font-bold">Password Baru<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="rs-input" /></label>
            <label className="block text-sm font-bold">Konfirmasi Password<input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="rs-input" /></label>
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
            {error && <p role="alert" className="rs-form-error">{error}</p>}
            <button disabled={busy || !token} className="rs-button rs-button-primary w-full">{busy ? "Memproses..." : "Reset Password"}</button>
          </form>
          <Link href="/forgot-password" className="rs-button rs-button-ghost mt-4 w-full">Minta Link Reset Baru</Link>
          <Link href="/login" className="rs-button rs-button-ghost mt-3 w-full">Kembali ke login</Link>
        </section>
      </div>
    </main>
  );
}
