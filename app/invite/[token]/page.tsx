import InvitationExperience from "./InvitationExperience";

export default async function ClientDiscInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InvitationExperience token={token} />;
}
