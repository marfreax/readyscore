import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getClientOrganizationWorkspace } from "../../../../lib/client-organization/service";
import { getCorporateCreditSummary, listCorporateDiscPackages } from "../../../../lib/client-organization/commerce";
import ClientWorkspaceShell from "../ClientWorkspaceShell";
import CorporatePricing from "./CorporatePricing";

export const dynamic = "force-dynamic";

export default async function CorporatePricingPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fcorporate");
  const { organizationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) notFound();
  const [packages, summary] = await Promise.all([
    listCorporateDiscPackages(),
    getCorporateCreditSummary(organizationId, session.user.id),
  ]);
  return <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="pricing" role={workspace.membership.role}>
    <CorporatePricing organizationId={organizationId} packages={packages} summary={summary} canPurchase={workspace.membership.role === "ADMIN"} />
  </ClientWorkspaceShell>;
}
