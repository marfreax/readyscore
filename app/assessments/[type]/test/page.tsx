import { notFound, redirect } from "next/navigation";
import AssessmentRunner from "../../../../components/assessment/AssessmentRunner";
import { getCurrentSession } from "../../../../lib/auth/session";

const TYPES = ["cognitive", "eq", "disc", "riasec"] as const;

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export default async function AssessmentTestPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as (typeof TYPES)[number])) notFound();
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/assessments/${type}/test`);
  return <AssessmentRunner type={type as "cognitive" | "eq" | "disc" | "riasec"} />;
}
