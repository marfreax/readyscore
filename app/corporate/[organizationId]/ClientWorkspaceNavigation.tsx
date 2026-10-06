"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, LayoutDashboard, ListChecks, LogOut, Settings2, UsersRound } from "lucide-react";

type Section = "dashboard" | "people" | "invitations" | "reports" | "pricing" | "settings";

export default function ClientWorkspaceNavigation({ organizationId, fallbackActive, role }: { organizationId: string; fallbackActive: Section; role: "ADMIN" | "VIEWER" }) {
  const pathname = usePathname();
  const root = `/corporate/${encodeURIComponent(organizationId)}`;
  const routeActive: Section = pathname.endsWith("/settings") ? "settings"
    : pathname.endsWith("/pricing") ? "pricing"
    : pathname.endsWith("/reports") || pathname.includes("/results/") ? "reports"
    : pathname.endsWith("/people") ? "people"
    : pathname.endsWith("/invitations") ? "invitations"
    : fallbackActive;
  const items = [
    { key: "dashboard" as const, label: "Ringkasan", hint: "Status dan aktivitas", href: root, icon: LayoutDashboard },
    { key: "people" as const, label: "Direktori orang", hint: "Karyawan, candidate, alumni", href: `${root}/people`, icon: UsersRound },
    { key: "invitations" as const, label: "Undangan DISC", hint: "Kirim dan pantau test", href: `${root}/invitations`, icon: ClipboardList },
    { key: "reports" as const, label: "Laporan", hint: "Hasil DISC peserta", href: `${root}/reports`, icon: ListChecks },
    { key: "pricing" as const, label: "Paket & kredit", hint: "Saldo dan pembelian DISC", href: `${root}/pricing`, icon: CreditCard },
    ...(role === "ADMIN" ? [{ key: "settings" as const, label: "Pengaturan", hint: "Profil dan branding", href: `${root}/settings`, icon: Settings2 }] : []),
  ];

  return (
    <nav aria-label="Navigasi client" className="rs-card flex gap-2 overflow-x-auto p-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:p-3">
      {items.map((item) => {
        const selected = item.key === routeActive;
        const Icon = item.icon;
        return (
          <Link key={item.key} href={item.href} aria-current={selected ? "page" : undefined} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 transition lg:min-w-0 ${selected ? "bg-indigo-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>
            <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-white/15 text-white" : "bg-slate-100 text-indigo-700"}`}><Icon className="h-4 w-4" /></span>
            <span><span className="block text-sm font-black">{item.label}</span><span className={`hidden text-[11px] lg:block ${selected ? "text-indigo-100" : "text-slate-400"}`}>{item.hint}</span></span>
          </Link>
        );
      })}
      <div className="hidden flex-1 lg:block" />
      <Link href="/logout" className="flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition hover:bg-slate-50">
        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100"><LogOut className="h-4 w-4" /></span>
        <span className="text-sm font-black">Keluar</span>
      </Link>
    </nav>
  );
}
