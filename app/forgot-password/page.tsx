"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.code ?? "PASSWORD_RESET_REQUEST_FAILED");
      setMessage(data.message);
    } catch {
      setError("Permintaan reset password tidak dapat diproses saat ini. Silakan coba lagi.");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <section className="rs-card w-full border-white/10 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="rs-eyebrow">ReadyScore</p>
          <h1 className="rs-title mt-3 text-3xl">Lupa password?</h1>
          <p className="rs-subtitle mt-2">Masukkan email akun Anda untuk menerima instruksi reset password.</p>
          <form onSubmit={submit} className="rs-form mt-7">
            <label className="block text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rs-input" /></label>
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
            {error && <p role="alert" className="rs-form-error">{error}</p>}
            <button disabled={busy} className="rs-button rs-button-primary w-full">{busy ? "Memproses..." : "Kirim Link Reset Password"}</button>
          </form>
          <Link href="/login" className="rs-button rs-button-ghost mt-4 w-full">Kembali ke login</Link>
        </section>
      </div>
    </main>
  );
}
