"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [clientIntent, setClientIntent] = useState(false);

  useEffect(() => {
    setClientIntent(new URLSearchParams(window.location.search).get("next") === "/corporate");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.code ?? "REGISTER_FAILED");
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/app";
      window.location.assign(safeNext);
    } catch (err) {
      const code = err instanceof Error ? err.message : "REGISTER_FAILED";
      setError(code === "EMAIL_ALREADY_EXISTS" ? "Email tersebut sudah terdaftar." : code === "PASSWORD_TOO_SHORT" ? "Password minimal 8 karakter." : code === "DATABASE_UNAVAILABLE" ? "Database lokal belum tersedia. Pastikan Docker dan database ReadyScore sudah berjalan, lalu coba lagi." : "Registrasi tidak dapat diproses.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
     <Script
  id="meta-pixel"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1600994505022613');
      fbq('track', 'PageView');
    `,
  }}
/>

       <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <section className="rs-card w-full border-white/10 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="rs-eyebrow">ReadyScore</p>
          <h1 className="rs-title mt-3 text-3xl">Buat akun</h1>
          <p className="rs-subtitle mt-2">Satu akun untuk mengelola assessment dan hasil ReadyScore Anda.</p>
          {clientIntent && <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">Setelah mendaftar, lengkapi nama organisasi untuk membuat ruang kerja Client Portal dan mengundang peserta DISC.</p>}
          <form onSubmit={submit} className="rs-form mt-7">
            <label className="block text-sm font-bold">Nama<input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="rs-input" /></label>
            <label className="block text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rs-input" /></label>
            <label className="block text-sm font-bold">Password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="rs-input" /><span className="rs-form-help">Minimal 8 karakter.</span></label>
            {error && <p role="alert" className="rs-form-error">{error}</p>}
            <button disabled={busy} className="rs-button rs-button-primary w-full">{busy ? "Membuat akun..." : "Daftar"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" onClick={(event) => {
            const next = new URLSearchParams(window.location.search).get("next");
            if (next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
              event.preventDefault();
              window.location.assign(`/login?next=${encodeURIComponent(next)}`);
            }
          }} className="font-black text-indigo-600">Masuk</Link></p>
        </section>
      </div>
    </main>
  );
}
