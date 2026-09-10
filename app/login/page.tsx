"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.code ?? "LOGIN_FAILED");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") ? next : "/app");
    } catch (err) {
      const code = err instanceof Error ? err.message : "LOGIN_FAILED";
      setError(code === "INVALID_CREDENTIALS" ? "Email atau password salah." : "Login tidak dapat diproses.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <section className="rs-card w-full border-white/10 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="rs-eyebrow">ReadyScore</p>
          <h1 className="rs-title mt-3 text-3xl">Masuk ke akun</h1>
          <p className="rs-subtitle mt-2">Akses dashboard, hasil assessment, profile, dan entitlement Anda.</p>
          <form onSubmit={submit} className="rs-form mt-7">
            <label className="block text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rs-input" /></label>
            <label className="block text-sm font-bold">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="rs-input" /></label>
            {error && <p role="alert" className="rs-form-error">{error}</p>}
            <button disabled={busy} className="rs-button rs-button-primary w-full">{busy ? "Memproses..." : "Masuk"}</button>
          </form>
          <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="font-black text-indigo-600">Lupa password?</Link></p>
          <p className="mt-6 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-black text-indigo-600">Daftar</Link></p>
          <Link href="/" className="rs-button rs-button-ghost mt-3 w-full">Kembali ke beranda</Link>
        </section>
      </div>
    </main>
  );
}
