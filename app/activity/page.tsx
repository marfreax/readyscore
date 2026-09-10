import { redirect } from "next/navigation";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";
import { Card } from "../../components/ui/DesignSystem";
import { getCurrentSession } from "../../lib/auth/session";
import { getUserActivity } from "../../lib/activity/service";
import { ActivityWorkspace } from "../../components/app/ActivityWorkspace";

export default async function ActivityPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/activity");

  const activity = await getUserActivity(session.user.id);

  return (
    <CustomerPageShell
      userName={session.user.name}
      eyebrow="Activity"
      title="Perjalanan aktivitas assessment Anda"
      description="Timeline perjalanan assessment Anda. Lihat apa yang sudah dilakukan dan lanjutkan tindakan berikutnya."
    >
      <div className="space-y-6 pb-10">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Activity summary">
          {[
            ["Total", activity.total],
            ["Completed", activity.completed],
            ["In progress", activity.inProgress],
            ["Inactive", activity.inactive],
          ].map(([label, value]) => (
            <Card key={String(label)} className="px-5 py-5">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </Card>
          ))}
        </section>

        <Card tone="accent" className="px-5 py-5 sm:px-6">
          <p className="rs-eyebrow">Your journey</p>
          <h2 className="mt-1 text-xl font-black">{activity.total} aktivitas tercatat</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Data berasal dari attempt assessment akun ini dan ditampilkan tanpa mengubah hasil pengukuran.
          </p>
        </Card>

        <ActivityWorkspace items={activity.items} />
      </div>
    </CustomerPageShell>
  );
}