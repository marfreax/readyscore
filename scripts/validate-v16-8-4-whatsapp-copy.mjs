import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const delivery = fs.readFileSync(path.join(root, "lib/free-delivery.ts"), "utf8");
const failures = [];

const required = [
  "caption: [",
  "`Halo ${name}! 👋`",
  "Terima kasih sudah menyelesaikan Assessment di ReadyScore.",
  "🎉 Free Report kamu sudah siap!",
  "Laporan ini berisi gambaran awal tentang profil dirimu, potensi karier",
  "📎 Silakan download Free Report kamu di atas.",
  "Mau mendapatkan insight yang lebih lengkap? 🚀",
  "Daftar di ReadyScore dan lanjutkan eksplorasimu untuk mendapatkan:",
  "✅ Akses penuh assessment",
  "✅ Analisis yang lebih mendalam",
  "✅ Rekomendasi karier & skill yang lebih detail",
  "✅ Perkembanganmu dari waktu ke waktu",
  "👉 Daftar sekarang:",
  "https://app.readyscore.id/register",
  "Kalau ada pertanyaan, langsung balas pesan ini ya.",
  "Kami siap membantu 😊",
  "Tim ReadyScore",
  "Know Yourself. Build What's Next.",
];

for (const token of required) {
  if (!delivery.includes(token)) failures.push(`WHATSAPP_COPY_CONTRACT:${token}`);
}

if (delivery.includes("caption: `Free Report ReadyScore untuk ${name}`")) {
  failures.push("WHATSAPP_COPY_LEGACY_CAPTION_PRESENT");
}

const captionBlock = delivery.match(/caption: \[([\s\S]*?)\]\.join\("\\n"\)/);
if (!captionBlock) {
  failures.push("WHATSAPP_COPY_CONTRACT:caption block not found");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("V16.8.4 WhatsApp Free Report conversion copy gate: PASS");
console.log("WhatsApp caption: new conversion copy + registration CTA");
console.log("WhatsApp legacy caption: absent");
