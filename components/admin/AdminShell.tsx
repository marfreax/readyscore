"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardList,
  UserRoundPlus,
  FileCheck2,
  History,
  LayoutDashboard,
  LogOut,
  Plug,
  Settings2,
  ShieldCheck,
  Users,
  X,
  Menu,
  Package,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const groups = [
  {
    label: "OVERVIEW",
    items: [{ key: "overview", href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "CONTENT",
    items: [
      { key: "questions", href: "/admin/question-bank", label: "Question Bank", icon: ClipboardList },
      { key: "packages", href: "/admin/question-packages", label: "Question Packages", icon: Package },
      { key: "review", href: "/admin/review", label: "Review & Publishing", icon: FileCheck2 },
      { key: "config", href: "/admin/assessment-config", label: "Assessment Configuration", icon: Settings2 },
    ],
  },
  {
    label: "AUDITABILITY",
    items: [{ key: "audit", href: "/admin/audit", label: "Audit Trail", icon: History }],
  },
  {
    label: "CONVERSATION",
    items: [{ key: "whatsapp", href: "/admin/whatsapp", label: "WhatsApp Inbox", icon: MessageCircle }],
  },
  {
    label: "ACQUISITION",
    items: [{ key: "leads", href: "/admin/leads", label: "Business Leads", icon: UserRoundPlus }],
  },
  {
    label: "USERS & ACCESS",
    items: [{ key: "users", href: "/admin/users", label: "Users & Access", icon: Users }],
  },
  {
    label: "INTEGRATIONS",
    items: [{ key: "integrations", href: "/admin/integrations", label: "Integrations", icon: Plug }],
  },
] as const;

function activeFor(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="rs-eyebrow px-3 pb-2 text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeFor(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={`rs-workspace-link ${active ? "rs-workspace-link-active" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  adminName,
}: {
  children: ReactNode;
  adminName: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="rs-page">
      <a className="rs-skip-link" href="#admin-main-content">
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="rs-container flex min-h-16 items-center justify-between gap-4 py-3">
          <Link href="/admin" className="rs-brand" aria-label="ReadyScore admin overview">
            <span className="rs-brand-mark">R</span>
            <span>
              <span className="rs-brand-name">ReadyScore</span>
              <span className="rs-brand-meta">Admin workspace</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black text-slate-800">{adminName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Administrator
              </p>
            </div>
            <Link href="/app" className="rs-button rs-button-secondary hidden sm:inline-flex">
              Customer App
            </Link>
            <Link href="/logout" className="rs-button rs-button-secondary">
              <LogOut className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span>Keluar</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="rs-container py-2">
          <button
            type="button"
            className="rs-button rs-button-secondary w-full justify-between"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="inline-flex items-center gap-2">
              {mobileOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{mobileOpen ? "Tutup menu" : "Buka admin menu"}</span>
            </span>
            <span className="text-xs font-bold text-slate-400">Administration</span>
          </button>
          <div id="admin-mobile-navigation" hidden={!mobileOpen} className="pb-3 pt-3">
            <AdminNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px]">
        <aside
          className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block"
          aria-label="Admin workspace"
        >
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
            <AdminNav />
            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-900">
              <div className="flex items-center gap-2 font-black">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Protected operations
              </div>
              <p className="mt-2 leading-5">
                Content, configuration, access, and integration controls remain behind admin authorization.
              </p>
            </div>
          </div>
        </aside>

        <main id="admin-main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
