"use client";

import { FormEvent, useState } from "react";

type Organization = { id: string; code: string; name: string; websiteUrl: string | null; logoUrl: string | null; status: string; memberships: { role: string; status: string; user: { name: string; email: string } }[] };

export default function ClientOrganizationOperations({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/client-organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: form.get("code"), name: form.get("name"), websiteUrl: form.get("websiteUrl"), logoUrl: form.get("logoUrl"), adminEmail: form.get("adminEmail") }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.code === "CLIENT_ADMIN_USER_NOT_FOUND" ? "Email administrator Corporate belum memiliki akun ReadyScore." : result?.error?.code === "P2002" ? "Kode organisasi sudah digunakan." : "Organisasi belum dapat dibuat.");
      setOrganizations((current) => [{ ...result.organization, memberships: [{ role: "ADMIN", status: "ACTIVE", user: { name: "", email: String(form.get("adminEmail")) } }] }, ...current]);
      formElement.reset(); setMessage("Organisasi Corporate dan akses administrator berhasil dibuat.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Organisasi belum dapat dibuat."); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <section className="rs-card p-6"><p className="rs-eyebrow">Provisioning</p><h2 className="mt-2 text-xl font-black">Tambah Corporate</h2><form onSubmit={create} className="mt-5 space-y-4">
      <label className="block text-sm font-bold">Kode organisasi<input required name="code" maxLength={40} placeholder="ACME" className="rs-input mt-2 w-full" /></label>
      <label className="block text-sm font-bold">Nama perusahaan<input required name="name" maxLength={160} placeholder="Nama perusahaan" className="rs-input mt-2 w-full" /></label>
      <label className="block text-sm font-bold">URL situs (HTTPS)<input type="url" name="websiteUrl" placeholder="https://perusahaan.com" className="rs-input mt-2 w-full" /></label>
      <label className="block text-sm font-bold">URL logo (HTTPS)<input type="url" name="logoUrl" placeholder="https://..." className="rs-input mt-2 w-full" /></label>
      <label className="block text-sm font-bold">Email administrator Corporate<input required type="email" name="adminEmail" placeholder="admin@perusahaan.com" className="rs-input mt-2 w-full" /></label>
      <p className="text-xs leading-5 text-slate-500">Administrator Corporate perlu memiliki akun ReadyScore lebih dahulu. Hanya administrator organisasi yang dapat mengundang peserta atau mengubah kategori.</p>
      {message && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      <button disabled={busy} className="rs-button rs-button-primary w-full justify-center">{busy ? "Menyimpan..." : "Buat organisasi"}</button>
    </form></section>
    <section className="rs-card p-6"><p className="rs-eyebrow">Tenant aktif</p><h2 className="mt-2 text-xl font-black">Organisasi terdaftar</h2>{organizations.length === 0 ? <p className="mt-5 text-sm text-slate-500">Belum ada organisasi Corporate.</p> : <div className="mt-5 space-y-3">{organizations.map((organization) => <article key={organization.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">{organization.code}</p><h3 className="mt-1 font-black">{organization.name}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{organization.status}</span></div><p className="mt-3 text-sm text-slate-600">{organization.memberships.filter((membership) => membership.status === "ACTIVE").map((membership) => `${membership.user.email} (${membership.role})`).join(", ") || "Belum ada member aktif"}</p></article>)}</div>}</section>
  </div>;
}
