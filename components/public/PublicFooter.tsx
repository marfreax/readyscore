import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm text-slate-600 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-black text-slate-900">ReadyScore</p>
          <p className="mt-2 max-w-sm leading-6">Personality Assessment untuk membantu pengguna memahami pola diri melalui assessment yang tersedia di ReadyScore.</p>
          <p className="mt-4 text-xs leading-5 text-slate-500">PT. PEMUDA PENCARI CUAN TEKNOLOGI<br />Menara 165, Jl. T.B. Simatupang Kav. 1, RT.3/RW.3, Cilandak Timur, Pasar Minggu, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12560</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">ReadyScore</p>
          <div className="mt-3 grid gap-2">
            <Link href="/" className="hover:text-slate-950">Beranda</Link>
            <Link href="/login" className="hover:text-slate-950">Masuk</Link>
            <Link href="/register" className="hover:text-slate-950">Daftar</Link>
            <Link href="/free" className="hover:text-slate-950">Free Test</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Legal & Privacy</p>
          <div className="mt-3 grid gap-2">
            <Link href="/privacy-policy" className="hover:text-slate-950">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-950">Terms of Service</Link>
            <Link href="/data-deletion" className="hover:text-slate-950">User Data Deletion</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-400">© 2026 PT. PEMUDA PENCARI CUAN TEKNOLOGI · ReadyScore</div>
    </footer>
  );
}
