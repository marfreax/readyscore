import type { Metadata } from "next";
import { LegalPage } from "../../components/public/LegalPage";
import { DataDeletionRequestForm } from "../../components/public/DataDeletionRequestForm";

export const metadata: Metadata = { title: "User Data Deletion | ReadyScore", description: "Instructions to request deletion of ReadyScore user data." };

export default function DataDeletionPage() {
  return <LegalPage title="User Data Deletion" eyebrow="Data Privacy" updatedAt="30 September 2026">
    <p>Halaman ini menjelaskan cara meminta penghapusan data yang terkait dengan ReadyScore. Proses penghapusan memperhatikan kepemilikan akun, keamanan, dan kewajiban retensi data yang mungkin berlaku.</p>
    <h2>1. Cara Mengajukan Permintaan</h2>
    <ol><li>Isi formulir di bawah menggunakan email yang terkait dengan akun ReadyScore.</li><li>Kami memverifikasi bahwa permintaan berasal dari pemilik akun atau pihak yang berwenang.</li><li>Setelah verifikasi, akun dinonaktifkan dan data identitas aplikasi yang tidak lagi diperlukan akan dihapus atau dianonimkan.</li><li>Data yang wajib dipertahankan untuk transaksi, audit, keamanan, pencegahan fraud, atau kewajiban hukum dapat tetap disimpan untuk tujuan tersebut.</li></ol>
    <h2>2. Apa yang Dilakukan Setelah Disetujui</h2>
    <ul><li>Session aktif dicabut.</li><li>Authentication/reset artifacts yang tidak lagi diperlukan dihapus.</li><li>Nama dan email identitas akun dianonimkan.</li><li>Nama subject/profile yang terkait dianonimkan.</li><li>Historical records yang diperlukan untuk integritas transaksi, audit, atau kewajiban hukum tidak dihapus secara destruktif.</li></ul>
    <h2>3. Data yang Dipertahankan</h2>
    <p>Penghapusan data tidak selalu berarti menghapus setiap record database. Catatan transaksi, payment/order history, audit trail, dan data lain dapat dipertahankan apabila diperlukan untuk kewajiban hukum, keamanan, pencegahan fraud, atau integritas historical record.</p>
    <h2>4. Permintaan Terkait Meta</h2>
    <p>Jika Anda berinteraksi dengan ReadyScore melalui produk Meta atau integrasi pihak ketiga yang terkait, Anda dapat menggunakan halaman ini untuk meminta penghapusan data ReadyScore yang terkait dengan akun atau interaksi tersebut. Kami tetap melakukan verifikasi sebelum memproses permintaan.</p>
    <DataDeletionRequestForm />
    <h2>5. Kontak</h2><p>PT. PEMUDA PENCARI CUAN TEKNOLOGI, Menara 165, Jl. T.B. Simatupang Kav. 1, RT.3/RW.3, Cilandak Timur, Pasar Minggu, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12560.</p>
  </LegalPage>;
}
