"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, UserRound, ClipboardList, Clock3, CreditCard, LogOut, ListChecks, KeyRound } from "lucide-react";

const WORKSPACE_ITEMS = [
  { key: "overview", href: "/app", label: "Overview", icon: LayoutDashboard },
  { key: "assessments", href: "/assessments", label: "Assessments", icon: ClipboardList },
  { key: "results", href: "/results", label: "Results", icon: ListChecks },
  { key: "profile", href: "/profile", label: "My Profile", icon: UserRound },
  { key: "activity", href: "/activity", label: "Activity", icon: Clock3 },
] as const;

const ACCOUNT_ITEMS = [
  { key: "access", href: "/access", label: "Access & Plans", icon: CreditCard },
  { key: "change-password", href: "/change-password", label: "Change Password", icon: KeyRound },
] as const;

const NAV_ITEMS = [...WORKSPACE_ITEMS, ...ACCOUNT_ITEMS] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

function resolveActiveKey(pathname: string, hash: string): NavKey {
  if (pathname === "/app") {
    if (hash === "#assessments") return "assessments";
    if (hash === "#recent") return "activity";
    if (hash === "#access") return "access";
    return "overview";
  }
  if (pathname === "/assessments" || pathname.startsWith("/assessments/")) return "assessments";
  if (pathname === "/activity" || pathname.startsWith("/activity/")) return "activity";
  if (pathname === "/access") return "access";
  if (pathname === "/change-password") return "change-password";
  if (pathname === "/profile") return "profile";
  if (pathname === "/results" || pathname.startsWith("/results/")) return "results";
  if (pathname === "/reports" || pathname.startsWith("/reports/")) return "results";
  if (pathname === "/result" || pathname.startsWith("/result/") || pathname === "/reassessment" || pathname.startsWith("/reassessment/")) return "assessments";
  return "overview";
}

function useActiveNav(): NavKey {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return useMemo(() => resolveActiveKey(pathname, hash), [pathname, hash]);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const active = useActiveNav();

  const renderItems = (items: readonly { key: string; href: string; label: string; icon: typeof LayoutDashboard }[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={`rs-workspace-link ${isActive ? "rs-workspace-link-active" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <section aria-label="Customer navigation">
        {renderItems(WORKSPACE_ITEMS)}
      </section>
      <section aria-labelledby="account-nav-heading">
        <h2 id="account-nav-heading" className="rs-eyebrow px-3 pb-2 text-slate-400">Account</h2>
        {renderItems(ACCOUNT_ITEMS)}
      </section>
    </div>
  );
}

export function CustomerSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block" aria-label="Customer workspace">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <nav aria-label="Customer navigation">
          <NavLinks />
        </nav>
      </div>
    </aside>
  );
}

export function CustomerMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 bg-white lg:hidden print-hidden">
      <div className="rs-container py-2">
        <button
          type="button"
          className="rs-button rs-button-secondary rs-a11y-target w-full justify-between"
          aria-expanded={open}
          aria-controls="customer-mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="inline-flex items-center gap-2">
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            <span>{open ? "Tutup menu" : "Buka menu"}</span>
          </span>
          <span className="text-xs font-bold text-slate-400">Navigation</span>
        </button>

        <div id="customer-mobile-navigation" hidden={!open} className="pb-2 pt-2">
          <nav aria-label="Workspace navigation mobile">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      </div>
    </div>
  );
}

export function CustomerHeaderActions({ userName }: { userName: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="text-xs font-black text-slate-800">{userName}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Customer</p>
      </div>
      <Link href="/logout" className="rs-button rs-button-secondary">
        <LogOut className="h-4 w-4 lg:hidden" aria-hidden="true" />
        <span>Keluar</span>
      </Link>
    </div>
  );
}
