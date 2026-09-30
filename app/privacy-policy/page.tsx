import type { Metadata } from "next";
import { LegalPage } from "../../components/public/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | ReadyScore", description: "Privacy Policy ReadyScore." };

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" eyebrow="Legal & Privacy" updatedAt="30 September 2026">
    <p>Privacy Policy ini menjelaskan bagaimana PT. PEMUDA PENCARI CUAN TEKNOLOGI ("ReadyScore", "kami") mengumpulkan, menggunakan, menyimpan, dan melindungi informasi yang diproses melalui ReadyScore.</p>
    <h2>1. Informasi yang Kami Kumpulkan</h2>
    <p>Kami dapat memproses informasi yang Anda berikan ketika membuat akun atau menggunakan layanan, termasuk nama, alamat email, informasi profil, pilihan profil/subject, data assessment, hasil assessment, laporan, serta informasi yang diperlukan untuk transaksi.</p>
    <h2>2. Data Assessment dan Profil</h2>
    <p>Jawaban, attempt, result, report, dan evidence assessment diproses untuk menyediakan layanan ReadyScore. Data assessment dipisahkan berdasarkan subject/profile yang menjadi pemilik konteks assessment.</p>
    <h2>3. Pembayaran</h2>
    <p>Untuk produk berbayar, ReadyScore menggunakan penyedia pembayaran pihak ketiga. Informasi pembayaran diproses sesuai mekanisme dan kebijakan penyedia pembayaran yang berlaku. ReadyScore tidak menjadikan data kartu pembayaran sebagai sumber data assessment.</p>
    <h2>4. Integrasi Pihak Ketiga</h2>
    <p>ReadyScore dapat menggunakan layanan pihak ketiga untuk hosting, database, analytics, email, pembayaran, dan integrasi platform. Jika integrasi Meta atau platform lain diaktifkan, data yang tersedia melalui integrasi tersebut dapat diproses sesuai tujuan layanan dan izin yang diberikan.</p>
    <h2>5. Tujuan Penggunaan</h2>
    <ul><li>Menyediakan dan mengoperasikan assessment, result, report, dan profile.</li><li>Mengelola akun, akses, entitlement, pembelian, dan reassessment.</li><li>Menjaga keamanan, mencegah penyalahgunaan, dan melakukan audit operasional.</li><li>Menyediakan dukungan dan komunikasi terkait layanan.</li><li>Memenuhi kewajiban hukum dan kebutuhan pencatatan transaksi.</li></ul>
    <h2>6. Penyimpanan dan Keamanan</h2>
    <p>Kami menerapkan kontrol akses, authentication, session management, audit trail, dan pembatasan akses berdasarkan kebutuhan operasional. Tidak ada sistem yang dapat menjamin keamanan absolut, tetapi kami berupaya menjaga data secara wajar sesuai kebutuhan layanan.</p>
    <h2>7. Retensi dan Penghapusan Data</h2>
    <p>Anda dapat meminta penghapusan data melalui halaman <a href="/data-deletion">User Data Deletion</a>. Setelah permintaan diverifikasi, data pribadi yang tidak lagi diperlukan akan dihapus atau dianonimkan. Catatan tertentu dapat dipertahankan apabila diperlukan untuk kewajiban hukum, keamanan, pencegahan fraud, audit, atau pencatatan transaksi.</p>
    <h2>8. Cookies dan Data Teknis</h2>
    <p>ReadyScore menggunakan cookie/session yang diperlukan untuk authentication, active subject context, keamanan, dan fungsi aplikasi. Layanan pihak ketiga dapat memiliki teknologi tracking atau cookie sendiri sesuai kebijakan mereka.</p>
    <h2>9. Hak Pengguna</h2>
    <p>Pengguna dapat meminta akses, koreksi, atau penghapusan data pribadi sesuai hukum yang berlaku dan kondisi data yang tersedia pada sistem.</p>
    <h2>10. Anak dan Pengguna di Bawah Umur</h2>
    <p>ReadyScore ditujukan untuk penggunaan dengan pendampingan dan tanggung jawab pengguna. Untuk data anak, pemrosesan harus dilakukan oleh atau dengan persetujuan pihak yang berwenang sesuai hukum yang berlaku.</p>
    <h2>11. Perubahan Privacy Policy</h2>
    <p>Kami dapat memperbarui kebijakan ini ketika layanan, teknologi, atau kewajiban hukum berubah. Versi terbaru akan dipublikasikan pada halaman ini.</p>
    <h2>12. Kontak</h2>
    <p>Pengelola layanan: <strong>PT. PEMUDA PENCARI CUAN TEKNOLOGI</strong>, Menara 165, Jl. T.B. Simatupang Kav. 1, RT.3/RW.3, Cilandak Timur, Pasar Minggu, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12560.</p>
  </LegalPage>;
}
