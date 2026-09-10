import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/change-password");
  return <ChangePasswordForm />;
}
