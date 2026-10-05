"use client";

import { FormEvent, useState } from "react";

export default function ClientOrganizationOnboarding() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/client/organization-onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), websiteUrl: form.get("websiteUrl"), logoUrl: form.get("logoUrl") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const code = result?.error?.code;
        throw new Error(code === "INVALID_LOGO_URL" ? "URL logo harus menggunakan HTTPS." : code === "INVALID_WEBSITE_URL" ? "URL situs harus menggunakan HTTPS." : code === "CLIENT_ORGANIZATION_ALREADY_LINKED" ? "Akun ini sudah terhubung ke organisasi. Muat ulang halaman." : "Ruang kerja organisasi belum dapat dibuat.");
      }
      window.location.assign(`/client/${encodeURIComponent(result.organization.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ruang kerja organisasi belum dapat dibuat.");
      setBusy(false);
    }
  }

  return (
    <section className="rs-card p-7 sm:p-9">
      <p className="rs-eyebrow">Pendaftaran client</p>
      <h2 className="mt-2 text-xl font-black">Buat ruang kerja organisasi</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Isi profil organisasi untuk mengaktifkan dashboard DISC. Anda akan menjadi administrator organisasi dan dapat mengundang peserta.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Nama organisasi<input required minLength={2} maxLength={160} name="name" autoComplete="organization" placeholder="Nama perusahaan" className="rs-input mt-2 w-full" /></label>
        <label className="block text-sm font-bold">Situs web organisasi (opsional)<input type="url" name="websiteUrl" maxLength={2048} placeholder="https://perusahaan.com" className="rs-input mt-2 w-full" /></label>
        <label className="block text-sm font-bold">URL logo (opsional)<input type="url" name="logoUrl" maxLength={2048} placeholder="https://perusahaan.com/logo.png" className="rs-input mt-2 w-full" /><span className="mt-1 block text-xs font-medium text-slate-500">Gunakan tautan gambar HTTPS yang dapat diakses publik.</span></label>
        <div className="sm:col-span-2">
          {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <button disabled={busy} className="rs-button rs-button-primary">{busy ? "Menyiapkan ruang kerja..." : "Buat ruang kerja client"}</button>
        </div>
      </form>
    </section>
  );
}
