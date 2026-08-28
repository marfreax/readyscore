import Link from "next/link";
import { getCurrentSession } from "../../lib/auth/session";

export default async function LogoutPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-black">Anda sudah keluar</h1><Link href="/login" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Masuk</Link></div></main>;
  }
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">ReadyScore</p><h1 className="mt-3 text-2xl font-black">Keluar dari akun?</h1><p className="mt-2 text-sm text-slate-600">Anda sedang masuk sebagai {session.user.email}.</p><form action="/api/auth/logout" method="post" className="mt-6"><button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Logout</button></form></div></main>;
}
