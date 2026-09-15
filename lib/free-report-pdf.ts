import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { FreeReportData } from "./free-report";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function buildFreeReportHtml(name: string, report: FreeReportData) {
  const recommendations = report.recommendations.map((item, i) => `<li><strong>${i + 1}.</strong> ${escapeHtml(item)}</li>`).join("");
  const strengths = report.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#0b1d3a;background:#fff}.page{width:210mm;height:297mm;padding:22mm 20mm;page-break-after:always;position:relative}.page:last-child{page-break-after:auto}.brand{font-size:16px;font-weight:800;letter-spacing:.02em}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#0a4c9a}.title{font-size:34px;line-height:1.08;font-weight:800;margin:18mm 0 7mm}.type{font-size:24px;color:#0a4c9a;font-weight:800}.h2{font-size:22px;font-weight:800;margin:0 0 8mm}.body{font-size:14px;line-height:1.75;color:#475569}.box{border:1px solid #dbe7f5;border-radius:14px;padding:8mm;margin-top:8mm;background:#f8fbff}.list{padding-left:6mm;font-size:13px;line-height:1.8}.footer{position:absolute;bottom:14mm;left:20mm;right:20mm;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:4mm}.premium{background:#0b1d3a;color:#fff;border-radius:16px;padding:10mm}.premium .body{color:#dbeafe}.cta{display:inline-block;margin-top:8mm;font-weight:800;color:#fff}.muted{font-size:11px;color:#64748b;line-height:1.6}
</style></head><body>
<section class="page"><div class="brand">ReadyScore</div><div class="eyebrow" style="margin-top:45mm">Free Report</div><div class="title">Halo, ${escapeHtml(name)}.</div><div class="type">Kamu Tipe ${escapeHtml(report.typeName)}</div><p class="body" style="margin-top:9mm">${escapeHtml(report.interpretation)}</p><div class="box"><div class="eyebrow">Hasil utama</div><p class="body">${escapeHtml(report.typeName)} adalah titik awal untuk mengeksplorasi pilihan belajar, jurusan, dan arah karier yang terasa lebih selaras dengan kecenderunganmu.</p></div><div class="footer">Free Report ReadyScore · Hasil ini adalah bahan eksplorasi, bukan penentu tunggal pilihan jurusan.</div></section>
<section class="page"><div class="eyebrow">01 · Type Explanation</div><div class="h2" style="margin-top:10mm">Tentang tipe ${escapeHtml(report.typeName)}</div><p class="body">${escapeHtml(report.interpretation)}</p><div class="box"><div class="eyebrow">Kekuatan awal</div><ul class="list">${strengths}</ul></div><div class="footer">ReadyScore · Free Report</div></section>
<section class="page"><div class="eyebrow">02 · Exploration</div><div class="h2" style="margin-top:10mm">Jurusan yang bisa kamu eksplorasi</div><p class="body">Berikut tiga contoh jurusan yang dapat menjadi titik awal eksplorasi berdasarkan hasil free assessment.</p><ol class="list" style="margin-top:9mm">${recommendations}</ol><div class="box"><div class="eyebrow">Gaya belajar</div><p class="body">${escapeHtml(report.learningStyle)}</p></div><div class="footer">Rekomendasi bersifat eksploratif dan tidak menggantikan pertimbangan akademik, minat, nilai, dan kondisi pribadi.</div></section>
<section class="page"><div class="eyebrow">03 · Next Step</div><div class="h2" style="margin-top:10mm">Kalau kamu ingin melihat gambaran yang lebih lengkap</div><div class="premium"><div style="font-size:23px;font-weight:800">ReadyScore Premium</div><p class="body" style="margin-top:6mm">Dapatkan cakupan yang lebih luas melalui multi-assessment profile, Cross-Test Profile, rekomendasi jurusan/karier yang lebih lengkap, dan action plan.</p><div class="cta">Lanjutkan eksplorasi →</div></div><p class="muted" style="margin-top:10mm">Harga dan paket mengikuti katalog ReadyScore saat checkout. Penawaran yang berlaku akan divalidasi oleh server.</p><div class="footer">ReadyScore · Free Report</div></section>
<section class="page"><div class="eyebrow">04 · Trust</div><div class="h2" style="margin-top:10mm">Gunakan hasil ini sebagai titik awal</div><p class="body">Tidak ada satu hasil assessment yang dapat menentukan masa depan seseorang. Gunakan Free Report ini untuk memulai percakapan, membandingkan pilihan, dan mengeksplorasi hal-hal yang paling menarik bagimu.</p><div class="box"><div class="eyebrow">ReadyScore</div><p class="body">Assessment dan insight untuk membantu kamu memahami diri dan mengambil langkah berikutnya dengan lebih terarah.</p></div><p class="muted" style="margin-top:10mm">© ReadyScore · Free Report · V16</p><div class="footer">Terima kasih sudah menggunakan ReadyScore.</div></section>
</body></html>`;
}

function chromiumPath() {
  return process.env.READYSCORE_CHROMIUM_PATH?.trim() || process.env.CHROME_BIN?.trim() || "/usr/bin/chromium";
}

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`PDF_RENDER_FAILED:${code}:${stderr.slice(-800)}`)));
  });
}

export async function renderFreeReportPdf(name: string, report: FreeReportData) {
  const dir = await mkdtemp(join(tmpdir(), "readyscore-free-report-"));
  const htmlPath = join(dir, "report.html");
  const pdfPath = join(dir, "report.pdf");
  try {
    await writeFile(htmlPath, buildFreeReportHtml(name, report), "utf8");
    await run(chromiumPath(), ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", `--print-to-pdf=${pdfPath}`, "--no-pdf-header-footer", `file://${htmlPath}`]);
    const pdf = await readFile(pdfPath);
    if (pdf.length < 1000 || pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("PDF_OUTPUT_INVALID");
    return pdf;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
