"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, EmptyState } from "../../components/ui/DesignSystem";

const LABELS: Record<string, string> = {
  cognitive: "Cognitive",
  eq: "Emotional Intelligence",
  disc: "DISC",
  riasec: "RIASEC",
  free: "Free Trial",
  premium: "Premium Trial",
};

type ActivityItem = {
  id: string;
  assessmentType: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";
  startedAt: string;
  completedAt: string | null;
  answered: number;
  total: number;
};

type Filter = "all" | "assessments" | "results";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "TODAY";
  if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date).toUpperCase();
}

function statusMeta(status: ActivityItem["status"]) {
  if (status === "COMPLETED") return { label: "Completed", tone: "success" as const, description: "Assessment selesai dan result tersedia bila akses mengizinkan." };
  if (status === "IN_PROGRESS") return { label: "In progress", tone: "warning" as const, description: "Assessment masih dapat dilanjutkan." };
  if (status === "ABANDONED") return { label: "Abandoned", tone: "neutral" as const, description: "Attempt dihentikan sebelum selesai." };
  return { label: "Expired", tone: "neutral" as const, description: "Attempt sudah tidak aktif." };
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const status = statusMeta(item.status);
  return (
    <Card className="px-5 py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black">{LABELS[item.assessmentType] ?? item.assessmentType}</p>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Dimulai · {formatDate(item.startedAt)}
            {item.completedAt ? ` · Selesai · ${formatDate(item.completedAt)}` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-600">{item.answered}/{item.total} pertanyaan terjawab.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{status.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          {item.status === "COMPLETED" ? (
            <Link href={`/result/${encodeURIComponent(item.id)}`} className="rs-button rs-button-secondary">View result</Link>
          ) : item.status === "IN_PROGRESS" ? (
            <Link href={`/assessments/${encodeURIComponent(item.assessmentType)}/test`} className="rs-button rs-button-primary">Continue</Link>
          ) : (
            <Link href="/assessments" className="rs-button rs-button-secondary">View assessments</Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ActivityWorkspace({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "results") return items.filter((item) => item.status === "COMPLETED");
    if (filter === "assessments") return items.filter((item) => item.status !== "COMPLETED");
    return items;
  }, [filter, items]);

  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: ActivityItem[] }[] = [];
    for (const item of filtered) {
      const key = new Date(item.startedAt).toDateString();
      const existing = groups.find((group) => group.key === key);
      if (existing) existing.items.push(item);
      else groups.push({ key, label: dayLabel(item.startedAt), items: [item] });
    }
    return groups;
  }, [filtered]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "assessments", label: "Assessments" },
    { value: "results", label: "Results" },
  ];

  return (
    <>
      <section aria-labelledby="activity-list-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="rs-eyebrow">Journey timeline</p>
            <h2 id="activity-list-title" className="rs-title mt-1 text-2xl">What you have done</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Activity filter">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={filter === item.value ? "rs-button rs-button-primary" : "rs-button rs-button-secondary"}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="px-6 py-10">
            <EmptyState
              title={filter === "results" ? "Belum ada result" : "Belum ada aktivitas"}
              description={filter === "results" ? "Result akan muncul setelah assessment selesai." : "Mulai salah satu assessment untuk membuat aktivitas pertama Anda."}
              action={<Link href="/assessments" className="rs-button rs-button-primary">Lihat Assessment</Link>}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.key} aria-labelledby={`activity-${group.key}`}>
                <p id={`activity-${group.key}`} className="mb-2 text-xs font-black tracking-[0.16em] text-slate-400">{group.label}</p>
                <div className="space-y-3">
                  {group.items.map((item) => <ActivityCard key={item.id} item={item} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <Card className="px-5 py-6 sm:px-6">
        <p className="rs-eyebrow">Activity boundary</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Ownership", "Riwayat hanya diambil untuk user yang sedang login."],
            ["Read-only", "Activity adalah tampilan history, bukan sumber scoring baru."],
            ["Next action", "In-progress dapat dilanjutkan; completed membuka result."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-black">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}