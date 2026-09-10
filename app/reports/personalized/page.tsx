import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../lib/auth/session";
import { getV15CustomerReportState } from "../../../lib/v15/customer-service";
import { CustomerPageShell } from "../../../components/app/CustomerPageShell";
import { Badge, Card } from "../../../components/ui/DesignSystem";
import { ExportPdfButton } from "../../../components/reports/ExportPdfButton";
import type { ReportBlock, ReportPage } from "../../../lib/v15/types";

const typeLabel: Record<string, string> = { COGNITIVE: "Cognitive", EQ: "Emotional Intelligence", DISC: "DISC", RIASEC: "RIASEC" };
function labelType(value: string) { return typeLabel[value] ?? value; }

function Block({ block }: { block: ReportBlock }) {
  if (block.type === "lead") return <p className="rs-report-lead">{block.text}</p>;
  if (block.type === "paragraph") return <p className="rs-report-paragraph">{block.text}</p>;
  if (block.type === "metric") return <div className="rs-report-metric"><span>{block.label}</span><strong>{block.value}</strong>{block.note ? <small>{block.note}</small> : null}</div>;
  if (block.type === "callout") return <section className="rs-report-callout"><p className="rs-report-label">{block.label}</p><p>{block.text}</p></section>;
  if (block.type === "list") return <section className="rs-report-list">{block.label ? <p className="rs-report-label">{block.label}</p> : null}<ul>{block.items.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul></section>;
  if (block.type === "recommendation") return <section className="rs-report-recommendation">
    <div className="rs-report-rec-heading"><span className="rs-report-rank">{block.rank}</span><div><p className="rs-report-label">REKOMENDASI {block.rank}</p><h3>{block.title}</h3></div></div>
    <div className="rs-report-rec-fit"><p className="rs-report-label">Kenapa pilihan ini muncul</p><p>{block.fit}</p></div>
    <div className="rs-report-rec-grid">
      <div><p className="rs-report-label">Sinyal yang mendukung</p><ul>{block.signals.map((x, i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div>
      <div><p className="rs-report-label">Yang perlu dicoba & diperhatikan</p><ul>{block.validation.map((x, i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div>
    </div>
    <div className="rs-report-rec-grid">
      <div><p className="rs-report-label">Contoh arah karier</p><p>{block.careers.join(" · ")}</p></div>
      <div><p className="rs-report-label">Coba dulu</p><ul>{block.actions.map((x, i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div>
    </div>
  </section>;
  if (block.type === "week") return <section className="rs-report-week">
    <div className="rs-report-week-number">0{block.week}</div><div className="rs-report-week-main"><p className="rs-report-label">MINGGU {block.week}</p><h3>{block.title}</h3><p className="rs-report-week-objective">{block.objective}</p>
      <div className="rs-report-rec-grid"><div><p className="rs-report-label">Langkah yang disarankan</p><ul>{block.actions.map((x, i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div><div><p className="rs-report-label">Peran orang tua</p><ul>{block.parentActions.map((x, i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div></div>
      <p className="rs-report-linked"><strong>Pilihan yang sedang divalidasi:</strong> {block.linkedMajors.join(" · ") || "belum ada pilihan yang cukup didukung"}</p>
    </div>
  </section>;
  return null;
}

function ReportPageView({ page, pageCount }: { page: ReportPage; pageCount: number }) {
  const isCover = page.pageNumber === 1;
  return <article id={`v15-page-${page.pageNumber}`} className={`rs-v15-page ${isCover ? "rs-v15-cover" : ""}`} aria-labelledby={`v15-page-title-${page.pageNumber}`}>
    <div className="rs-report-page-inner">
      {!isCover && <div className="rs-report-page-top"><p className="rs-report-section">{page.section}</p><span>{String(page.pageNumber).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span></div>}
      {isCover ? <div className="rs-report-cover-content"><div className="rs-report-cover-brand"><Image src="/readyscore-logo.png" alt="ReadyScore" width={620} height={220} priority /></div><p className="rs-report-section">PERSONALIZED REPORT</p><h2 id={`v15-page-title-${page.pageNumber}`}>{page.title}</h2><p className="rs-report-cover-subtitle">Memahami pola diri, mengeksplorasi pilihan, dan menyusun langkah berikutnya.</p><div className="rs-report-cover-rule" />{page.blocks.map((block, i) => <Block key={i} block={block} />)}<p className="rs-report-cover-foot">ReadyScore · Personalized Assessment</p></div> : <><div className="rs-report-page-heading"><h2 id={`v15-page-title-${page.pageNumber}`}>{page.title}</h2></div><div className="rs-report-page-content">{page.blocks.map((block, i) => <Block key={i} block={block} />)}</div></>}
    </div>
    <div className="rs-report-page-footer"><span>READY SCORE</span><span>{String(page.pageNumber).padStart(2, "0")}</span></div>
  </article>;
}

export default async function PersonalizedReportPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/reports/personalized");
  const state = await getV15CustomerReportState(session.user.id);
  if (!state.access) return <CustomerPageShell userName={session.user.name} eyebrow="Personalized Report · V15" title="Personalized report belum tersedia" description="Report ini membutuhkan entitlement personalized report pada akun Anda."><Card className="px-6 py-7"><p className="text-sm leading-7 text-slate-600">Akses report belum aktif pada akun ini.</p><Link href="/access" className="rs-button rs-button-primary mt-5">Lihat akses</Link></Card></CustomerPageShell>;
  if (state.readiness !== "READY" || !state.report) return <CustomerPageShell userName={session.user.name} eyebrow="Personalized Report · V15" title="Report sedang menunggu data lengkap" description="Personalized report akan tersedia setelah empat core assessment selesai dan memiliki result."><Card className="px-6 py-7"><Badge tone="warning">Not ready</Badge><h2 className="mt-4 text-2xl font-black">Selesaikan assessment yang masih kurang</h2><p className="mt-2 text-sm leading-7 text-slate-600">Evidence yang sudah tersedia tetap aman. Tidak ada skor baru yang dibuat oleh report engine.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{state.missingTypes.map((type) => <div key={type} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{labelType(type)} — belum tersedia</div>)}</div><Link href="/assessments" className="rs-button rs-button-primary mt-5">Lihat Assessments</Link></Card></CustomerPageShell>;

  const { document } = state.report;
  return <CustomerPageShell userName={session.user.name} eyebrow="Personalized Report · V15" title="Profil personal & arah pengembangan" description="Laporan personal yang menggabungkan empat assessment, pola utama, arah jurusan, alasan kecocokan, dan action plan 30 hari." printHideHeader>
    <div id="v15-personalized-report" className="rs-v15-report-document">
      <div className="rs-report-toolbar print-hidden"><div><Badge tone="success">Ready</Badge><span>{document.pageCount} halaman</span></div><div className="flex flex-wrap gap-2"><ExportPdfButton targetId="v15-personalized-report" /><Link href="/reports" className="rs-button rs-button-secondary">Kembali ke Reports</Link></div></div>
      <nav aria-label="Daftar isi" className="rs-report-toc print-hidden"><p className="rs-report-label">ISI LAPORAN</p><div>{document.pages.map((p) => <a key={p.pageNumber} href={`#v15-page-${p.pageNumber}`}><span>{String(p.pageNumber).padStart(2, "0")}</span>{p.title}</a>)}</div></nav>
      <div className="rs-report-pages">{document.pages.map((p) => <ReportPageView key={p.pageNumber} page={p} pageCount={document.pageCount} />)}</div>
      <div className="print-hidden rs-report-bottom-actions"><Link href="/results" className="rs-button rs-button-secondary">Lihat hasil assessment</Link><Link href="/profile" className="rs-button rs-button-secondary">Lihat My Profile</Link></div>
    </div>
  </CustomerPageShell>;
}
