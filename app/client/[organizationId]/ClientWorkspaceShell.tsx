import type { ReactNode } from "react";
import ClientWorkspaceNavigation from "./ClientWorkspaceNavigation";

type Section = "dashboard" | "people" | "invitations" | "reports" | "settings";

export default function ClientWorkspaceShell({
  organizationId,
  organizationName,
  websiteUrl,
  active,
  role,
  children,
}: {
  organizationId: string;
  organizationName: string;
  websiteUrl?: string | null;
  active: Section;
  role: "ADMIN" | "VIEWER";
  children: ReactNode;
}) {
  return (
    <main className="rs-page min-h-screen px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="rs-card p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700">ReadyScore</p>
            <p className="mt-1 text-xs font-bold text-slate-400">CLIENT PORTAL</p>
            <h1 className="mt-4 line-clamp-2 text-lg font-black leading-snug">{organizationName}</h1>
            {websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs font-semibold text-indigo-700 hover:underline">{websiteUrl.replace(/^https:\/\//, "")}</a>}
          </div>
          <ClientWorkspaceNavigation organizationId={organizationId} fallbackActive={active} role={role} />
          <p className="hidden px-2 text-xs text-slate-400 lg:block">Assessment provided by ReadyScore</p>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
