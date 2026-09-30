import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../lib/auth/session";
import ReassessmentCreditCheckout from "../../../components/commercial/ReassessmentCreditCheckout";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE", "LEARNING_PREFERENCE"] as const;
type TestType = (typeof VALID_TYPES)[number];

function normalizeTestType(value: string | string[] | undefined): TestType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = (raw ?? "").trim().toUpperCase();
  return VALID_TYPES.includes(normalized as TestType) ? normalized as TestType : null;
}

export default async function ReassessmentCreditCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/checkout/reassessment-credit");
  const params = await searchParams;
  const testType = normalizeTestType(params.testType);
  if (!testType) redirect("/access");

  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl p-8 text-center">Memuat pembayaran…</main>}>
      <ReassessmentCreditCheckout userName={session.user.name} testType={testType} />
    </Suspense>
  );
}
