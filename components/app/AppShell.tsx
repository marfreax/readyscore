import Link from "next/link";
import type { ReactNode } from "react";
import { CustomerMobileMenu, CustomerHeaderActions, CustomerSidebar } from "./CustomerNavigation";

export function AppShell({ children, userName }: { children: ReactNode; userName: string }) {
  return (
    <div className="rs-page">
      <a className="rs-skip-link" href="#main-content">Lewati ke konten utama</a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="rs-container flex h-16 items-center justify-between gap-4">
          <Link href="/app" className="rs-brand" aria-label="ReadyScore dashboard">
            <img
              src="/readyscore-logo.png"
              alt="ReadyScore Personality Assessment"
              className="rs-brand-logo"
            />
          </Link>

          <CustomerHeaderActions userName={userName} />
        </div>
      </header>

      <CustomerMobileMenu />

      <div className="mx-auto flex max-w-[1440px]">
        <CustomerSidebar />
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
