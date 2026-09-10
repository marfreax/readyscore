import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { Card } from "../ui/DesignSystem";

export function CustomerPageShell({ userName, eyebrow, title, description, children, printHideHeader = false }: { userName: string; eyebrow: string; title: string; description: string; children: ReactNode; printHideHeader?: boolean }) {
  return (
    <AppShell userName={userName}>
      <div className={`px-3 py-5 sm:px-6 lg:px-8 lg:py-8 ${printHideHeader ? "rs-print-report-shell" : ""}`}>
        <div className="mx-auto max-w-6xl">
          <Card className={`mb-6 px-5 py-6 sm:px-8 ${printHideHeader ? "print-hidden" : ""}`}>
            <p className="rs-eyebrow">{eyebrow}</p>
            <h1 className="rs-title mt-2">{title}</h1>
            <p className="rs-subtitle mt-3 max-w-3xl">{description}</p>
          </Card>
          {children}
        </div>
      </div>
    </AppShell>
  );
}
