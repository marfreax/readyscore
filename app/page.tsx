import FunnelPageTracker from "../components/free/FunnelPageTracker";
import Image from "next/image";
import Link from "next/link";

const steps = [
  { n: "01", t: "Jawab", d: "10 soal" },
  { n: "02", t: "Lihat hasil", d: "Instant" },
  { n: "03", t: "Eksplorasi", d: "Jurusan" },
];

export default function HomePage() {
  return (
    <>
      <FunnelPageTracker event="landing_view" />
      <main className="min-h-screen bg-[#F5F7FF] text-[#111827] antialiased">
        <header className="sticky top-0 z-50 border-b border-[#EDEEF6] bg-[#F5F7FF]/90 backdrop-blur-[10px]">
          <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6 md:px-8">
            <Link href="/" className="inline-flex items-center" aria-label="ReadyScore home">
              <Image
                src="/readyscore-logo.png"
                alt="ReadyScore Personality Assessment"
                width={2048}
                height={673}
                priority
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>

            <nav className="hidden items-center gap-7 text-[14px] font-medium text-[#4B5563] md:flex">
              <a href="#tentang" className="transition hover:text-[#111827]">Tentang</a>
              <a href="#cara-kerja" className="transition hover:text-[#111827]">Cara Kerja</a>
              <a href="#faq" className="transition hover:text-[#111827]">FAQ</a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#111827] transition hover:bg-white md:inline-flex"
              >
                Masuk
              </Link>
              <Link
                href="/free"
                className="inline-flex items-center rounded-full bg-[#0F172A] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition hover:-translate-y-px"
              >
                Mulai Tes
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1200px] px-6 pb-24 md:px-8">
          <div className="grid items-center gap-10 pt-6 md:grid-cols-[1.05fr_0.95fr] md:gap-6 md:pt-10">
            <div id="tentang">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFEB3B] px-3.5 py-1.5 text-[11px] font-bold tracking-widest text-[#111827] shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#111827]" />
                FREE TEST • ±1 MENIT
              </div>

              <h1 className="mt-6 text-[40px] font-[800] leading-[0.95] tracking-[-0.03em] md:text-[56px]">
                Kamu cocoknya
                <br />
                kuliah di jurusan
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">apa?</span>
                  <span className="absolute bottom-2 left-0 right-0 z-0 h-3 -rotate-1 bg-[#E8E9FF]" />
                </span>
              </h1>

              <p className="mt-5 max-w-[480px] text-[16px] leading-[1.6] text-[#4B5563] md:text-[17px]">
                Kenali pola minatmu lewat tes RIASEC singkat. Dapatkan gambaran awal tentang tipe dan arah jurusan yang layak kamu eksplorasi.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/free"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#0F172A] px-7 py-[15px] text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.2)] transition hover:-translate-y-px hover:shadow-[0_16px_32px_rgba(15,23,42,0.26)]"
                >
                  Mulai Tes Gratis
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0F172A] transition group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[12, 13, 14].map((img) => (
                    <div key={img} className="h-7 w-7 overflow-hidden rounded-full border-2 border-[#F5F7FF] bg-[#E5E7EB]">
                      <img src={`https://i.pravatar.cc/100?img=${img}`} className="h-full w-full object-cover" alt="" />
                    </div>
                  ))}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#F5F7FF] bg-[#0F172A] text-[10px] font-bold text-white">
                    +1k
                  </div>
                </div>
                <div className="text-[13px] text-[#6B7280]">
                  <span className="font-semibold text-[#111827]">1.247 siswa</span> sudah coba • <span className="font-semibold text-[#111827]">4.9/5</span> ⭐ • 10 soal • ±1 menit • gratis
                </div>
              </div>

              <div id="cara-kerja" className="mt-10 grid max-w-[520px] grid-cols-3 gap-3">
                {steps.map((step) => (
                  <div key={step.n} className="rounded-[18px] border border-[#EDEEF6] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="text-[11px] font-bold tracking-widest text-[#9CA3AF]">{step.n}</div>
                    <div className="mt-1 text-[13px] font-semibold">{step.t}</div>
                    <div className="text-[12px] text-[#6B7280]">{step.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex min-h-[520px] items-end justify-center md:h-[640px]">
              <div className="absolute left-1/2 top-[52%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8E9FF] opacity-80 blur-[1px]" />
              <div className="absolute left-1/2 top-[52%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8E9FF] opacity-90 blur-[48px]" />

              <div className="absolute left-[4%] top-[18%] z-20 -rotate-1">
                <div className="flex items-center gap-2 rounded-full border border-[#EDEEF6] bg-white px-3.5 py-2 text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <span>🔧</span> Realistic
                </div>
              </div>

              <div className="absolute right-[6%] top-[26%] z-20 rotate-1">
                <div className="flex items-center gap-2 rounded-full border border-[#EDEEF6] bg-white px-3.5 py-2 text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <span>🔬</span> Investigative
                </div>
              </div>

              <div className="absolute bottom-[18%] left-[8%] z-30 md:bottom-[16%] md:left-[2%]">
                <div className="relative max-w-[220px] rounded-[20px] rounded-bl-[6px] border border-[#EDEEF6] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                  <div className="flex items-center gap-2">
                    <span className="relative block h-2 w-2 rounded-full bg-[#22C55E]">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#22C55E] opacity-60" />
                    </span>
                    <span className="text-[12px] font-bold tracking-wide text-[#6B7280]">READY • ONLINE</span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-semibold leading-[1.3]">Hasilmu siap dieksplorasi.</p>
                  <p className="mt-1 text-[12px] leading-[1.4] text-[#6B7280]">Mulai dari pola minat, lalu temukan jurusan yang layak kamu pertimbangkan.</p>
                </div>
              </div>

              <Image
                src="/gina-counselor.png"
                alt="ReadyScore guide"
                width={608}
                height={1080}
                priority
                className="relative z-10 h-[480px] w-auto select-none object-contain drop-shadow-[0_24px_40px_rgba(15,23,42,0.18)] md:h-[560px]"
              />
              <div className="absolute bottom-6 left-1/2 z-0 h-5 w-[340px] -translate-x-1/2 rounded-full bg-black/10 blur-[16px]" />
            </div>
          </div>

          <div className="mt-14 flex items-center justify-between rounded-[24px] border border-[#EDEEF6] bg-white p-5 shadow-sm md:mt-20 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDEEF6] bg-[#F5F7FF] text-[15px] font-extrabold text-[#0F172A]">R</div>
              <div>
                <div className="text-[13px] font-semibold">Lihat contoh hasil tipe Realistic</div>
                <div className="text-[12px] text-[#6B7280]">Dapatkan hasil instant setelah menyelesaikan 10 soal.</div>
              </div>
            </div>
            <Link href="/free" className="rounded-full border border-[#EDEEF6] bg-[#F5F7FF] px-4 py-2 text-[13px] font-semibold transition hover:bg-[#EDEEF6]">
              Coba →
            </Link>
          </div>
        </section>

        <section id="faq" className="border-t border-[#EDEEF6] bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-14 md:px-8 md:py-20">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-[#6366F1]">TENTANG READYSCORE</p>
                <h2 className="mt-3 text-[28px] font-[800] leading-[1.05] tracking-tight">Mulai dari kenal diri, bukan sekadar pilih jurusan.</h2>
              </div>
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div className="rounded-[18px] border border-[#EDEEF6] bg-[#F8F8FF] p-5">
                  <h3 className="font-bold">Apa yang saya dapat?</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">Kamu mendapatkan gambaran awal tipe RIASEC dan arah jurusan yang bisa kamu eksplorasi.</p>
                </div>
                <div className="rounded-[18px] border border-[#EDEEF6] bg-[#F8F8FF] p-5">
                  <h3 className="font-bold">Berapa lama?</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">Free Test terdiri dari 10 pertanyaan dan dirancang selesai dalam sekitar satu menit.</p>
                </div>
                <div className="rounded-[18px] border border-[#EDEEF6] bg-[#F8F8FF] p-5">
                  <h3 className="font-bold">Apakah ini menentukan masa depan?</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">Tidak. Hasil assessment adalah bahan refleksi awal, bukan keputusan final tentang masa depanmu.</p>
                </div>
                <div className="rounded-[18px] border border-[#EDEEF6] bg-[#F8F8FF] p-5">
                  <h3 className="font-bold">Harus daftar akun?</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">Tidak untuk Free Test. Kamu bisa langsung mulai tanpa membuat akun terlebih dahulu.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#EDEEF6] bg-[#F5F7FF] py-8 text-center text-[11px] text-[#9CA3AF]">
          ReadyScore • Personality Assessment • © 2026
        </footer>
      </main>
    </>
  );
}
