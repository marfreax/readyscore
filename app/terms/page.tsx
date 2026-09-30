import type { Metadata } from "next";
import { LegalPage } from "../../components/public/LegalPage";

export const metadata: Metadata = { title: "Terms of Service | ReadyScore", description: "Terms of Service ReadyScore." };

export default function TermsPage() {
  return <LegalPage title="Terms of Service" eyebrow="Legal" updatedAt="30 September 2026">
    <p>Terms of Service ini mengatur penggunaan ReadyScore yang disediakan oleh PT. PEMUDA PENCARI CUAN TEKNOLOGI.</p>
    <h2>1. Penerimaan Ketentuan</h2><p>Dengan menggunakan ReadyScore, Anda menyetujui ketentuan ini. Jika Anda tidak menyetujuinya, jangan gunakan layanan.</p>
    <h2>2. Layanan ReadyScore</h2><p>ReadyScore menyediakan assessment dan pengalaman pendukung untuk membantu pengguna memahami pola diri. Assessment bukan diagnosis medis, bukan jaminan hasil akademik/karier, dan bukan pengganti keputusan profesional.</p>
    <h2>3. Akun dan Profil</h2><p>Account owner bertanggung jawab atas akun. Satu account dapat memiliki beberapa subject/profile. Assessment, entitlement, result, report, dan credit mengikuti subject yang ditetapkan sistem.</p>
    <h2>4. Assessment dan Result</h2><p>Hasil assessment harus dibaca sesuai makna dan batasan assessment masing-masing. ReadyScore tidak mengubah source score hanya untuk membuat hasil antar-assessment terlihat setara.</p>
    <h2>5. Produk Berbayar</h2><p>Produk komersial ReadyScore dapat mencakup Single Test, All Tests, dan All Tests + Profiling. Detail harga, paket, entitlement, dan checkout yang berlaku ditampilkan pada halaman Access &amp; Plans dan checkout.</p>
    <h2>6. Pembayaran</h2><p>Pembayaran diproses melalui payment gateway yang tersedia. Order dapat memiliki status pending, paid, failed, expired, atau cancelled sesuai hasil proses pembayaran.</p>
    <h2>7. Reassessment</h2><p>Reassessment hanya dapat dilakukan apabila eligibility dan credit yang berlaku mengizinkannya. Credit dan assessment state tetap subject-scoped.</p>
    <h2>8. Penggunaan yang Dilarang</h2><p>Pengguna tidak boleh mencoba mengakses data subject lain, memanipulasi assessment state, melakukan penyalahgunaan payment flow, mengganggu sistem, atau menggunakan layanan untuk tujuan melanggar hukum.</p>
    <h2>9. Intellectual Property</h2><p>Software, branding, content, question bank, report templates, dan materi ReadyScore tetap menjadi milik pihak yang berhak dan tidak boleh disalin atau didistribusikan tanpa izin.</p>
    <h2>10. Ketersediaan Layanan</h2><p>Kami berupaya menjaga layanan tetap tersedia, tetapi tidak menjamin layanan bebas dari gangguan, maintenance, kegagalan pihak ketiga, atau kondisi di luar kendali kami.</p>
    <h2>11. Data dan Privacy</h2><p>Pemrosesan data diatur lebih lanjut dalam <a href="/privacy-policy">Privacy Policy</a>. Permintaan penghapusan data dijelaskan pada <a href="/data-deletion">User Data Deletion</a>.</p>
    <h2>12. Pembatalan dan Refund</h2><p>Kebijakan pembatalan atau refund mengikuti ketentuan produk dan transaksi yang berlaku serta ketentuan hukum yang berlaku. Jika suatu transaksi memiliki aturan khusus, aturan tersebut ditampilkan pada checkout atau dokumen transaksi.</p>
    <h2>13. Perubahan Ketentuan</h2><p>Kami dapat memperbarui Terms of Service ketika layanan berubah. Versi terbaru akan dipublikasikan pada halaman ini.</p>
    <h2>14. Kontak</h2><p>PT. PEMUDA PENCARI CUAN TEKNOLOGI, Menara 165, Jl. T.B. Simatupang Kav. 1, RT.3/RW.3, Cilandak Timur, Pasar Minggu, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12560.</p>
  </LegalPage>;
}
