import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "../../../lib/auth/session";
import AssessmentRunner from "../../../components/assessment/AssessmentRunner";
import { AppShell } from "../../../components/app/AppShell";

const TYPES = new Set(["riasec", "disc", "eq", "cognitive"]);

const LABELS: Record<string, string> = {
  riasec: "RIASEC",
  disc: "DISC",
  eq: "EQ",
  cognitive: "Cognitive",
};

export default async function ReassessmentPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!TYPES.has(type)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/reassessment/${encodeURIComponent(type)}`);

  return (
    <AppShell userName={session.user.name}>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="rs-eyebrow">Customer reassessment</p>
            <p className="mt-1 text-sm font-black text-slate-900">{`${LABELS[type]} · Retake`}</p>
          </div>
          <p className="hidden text-xs font-black text-slate-500 sm:block">{`Assessment ${LABELS[type]}`}</p>
          <Link href="/app" className="rs-button rs-button-secondary">Dashboard</Link>
        </div>
      </div>
      <AssessmentRunner type={type as "riasec" | "disc" | "eq" | "cognitive"} mode="reassessment" />
    </AppShell>
  );
}
