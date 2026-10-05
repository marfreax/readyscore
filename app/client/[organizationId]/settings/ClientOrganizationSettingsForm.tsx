"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientOrganizationSettingsForm({
  organizationId,
  initialName,
  initialWebsiteUrl,
  initialLogoUrl,
}: {
  organizationId: string;
  initialName: string;
  initialWebsiteUrl: string | null;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(organizationId)}/settings`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), websiteUrl: form.get("websiteUrl"), logoUrl: form.get("logoUrl") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const code = result?.error?.code;
        throw new Error(code === "INVALID_WEBSITE_URL" ? "URL situs harus berupa alamat HTTPS yang valid." : code === "INVALID_LOGO_URL" ? "URL logo harus berupa alamat HTTPS yang valid." : "Profil organisasi belum dapat disimpan.");
      }
      setMessage("Profil organisasi berhasil disimpan.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil organisasi belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rs-card max-w-3xl space-y-5 p-6 sm:p-8">
      <label className="block text-sm font-bold">Nama organisasi<input required minLength={2} maxLength={160} name="name" defaultValue={initialName} autoComplete="organization" className="rs-input mt-2 w-full" /></label>
      <label className="block text-sm font-bold">URL situs web<input type="url" name="websiteUrl" maxLength={2048} defaultValue={initialWebsiteUrl ?? ""} placeholder="https://perusahaan.com" className="rs-input mt-2 w-full" /><span className="mt-1 block text-xs font-medium text-slate-500">Alamat situs akan ditampilkan sebagai profil organisasi.</span></label>
      <label className="block text-sm font-bold">URL logo<input type="url" name="logoUrl" maxLength={2048} defaultValue={initialLogoUrl ?? ""} placeholder="https://perusahaan.com/logo.png" className="rs-input mt-2 w-full" /><span className="mt-1 block text-xs font-medium text-slate-500">Logo ditampilkan kepada peserta pada undangan dan komunikasi assessment. Gunakan gambar HTTPS yang dapat diakses publik.</span></label>
      {initialLogoUrl ? <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><img src={initialLogoUrl} alt={`Logo ${initialName}`} className="h-12 w-12 rounded-lg object-contain" /><span className="text-xs text-slate-500">Pratinjau logo saat ini</span></div> : null}
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p> : null}
      <button disabled={busy} className="rs-button rs-button-primary">{busy ? "Menyimpan..." : "Simpan pengaturan"}</button>
    </form>
  );
}
