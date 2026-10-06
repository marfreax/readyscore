# ReadyScore V21 — Corporate Pricing & Affiliate

## 1. Tujuan dan prinsip

V21 menambahkan monetisasi DISC untuk organisasi Corporate dan satu program affiliate lintas produk ReadyScore umum dan Corporate. Fitur baru tidak mengubah alur assessment umum yang sudah berjalan. Istilah `Client` diganti menjadi `Corporate` pada UI dan komunikasi produk; nama tabel, model Prisma, dan API internal tetap dipertahankan untuk menghindari migrasi rename.

Semua pemberian kredit dan komisi harus bersumber dari pembayaran Midtrans yang terverifikasi, idempoten terhadap webhook ulang, dapat diaudit, dan dapat dikoreksi melalui ledger. Migration hanya diterapkan ke database lokal selama pengembangan; production tidak disentuh.

## 2. Harga dan kredit Corporate

| Paket | Kredit DISC | Harga total | Harga per tes |
|---|---:|---:|---:|
| Starter | 10 | Rp350.000 | Rp35.000 |
| Growth | 50 | Rp1.500.000 | Rp30.000 |
| Scale | 100 | Rp2.500.000 | Rp25.000 |

- Harga paket adalah snapshot order dalam IDR. Tidak ada langganan bulanan di V21.
- Hanya anggota Corporate ber-role ADMIN yang dapat membeli kredit untuk organisasi aktif miliknya.
- Midtrans adalah kanal pembayaran; kredit baru tersedia setelah status pembayaran terverifikasi PAID.
- Kredit berlaku 12 bulan sejak pembayaran berhasil. Kredit FIFO dialokasikan saat undangan dibuat agar tidak terpakai ganda, lalu menjadi konsumsi final saat peserta memulai assessment DISC Corporate.
- Kegagalan teknis yang membatalkan attempt mengembalikan kredit melalui entri ledger kompensasi; hasil tes yang sudah selesai tidak mengembalikan kredit.
- Saldo dan riwayat pembelian/ledger ditampilkan pada workspace Corporate.

## 3. Affiliate

### 3.1 Referral dan atribusi

- Affiliate memiliki kode referral unik dan URL berbagi ReadyScore.
- Referral berlaku untuk checkout B2C yang ada serta paket Corporate.
- Atribusi menggunakan affiliate pertama selama 30 hari. Kode pada URL dapat disimpan pada browser dan dipakai saat pengguna masuk/daftar; kode yang diketik saat checkout juga diterima jika belum ada atribusi sebelumnya.
- Atribusi melekat pada akun pembeli setelah login/registrasi sehingga dapat digunakan pada order eligible berikutnya.
- Order yang sudah memiliki atribusi tidak dipindah ke affiliate lain oleh parameter URL atau kode berikutnya.

### 3.2 Komisi dan saldo

- Rate awal affiliate adalah 10%. Admin mengatur satu persentase komisi per affiliate; nilai harus lebih dari 0% dan paling tinggi 100%.
- Rate dan affiliate disalin sebagai snapshot pada order saat dibuat. Perubahan konfigurasi hanya memengaruhi order berikutnya.
- Komisi dihitung dari nilai order yang benar-benar dibayar setelah diskon; jika pajak itemized, pajak tidak menjadi dasar komisi.
- Komisi masuk sebagai pending saat order menjadi PAID lalu tersedia H+1 berdasarkan waktu pembayaran.
- Refund/pembatalan setelah komisi masuk membukukan reversal. Jika saldo tersedia kurang, saldo affiliate dapat negatif dan dipotong dari komisi tersedia berikutnya.
- Nilai entri ledger tidak diedit atau dihapus; status pending menjadi tersedia setelah H+1, sedangkan koreksi nominal dilakukan dengan entri reversal/adjustment baru.

### 3.3 Pencairan dan administrasi

- Affiliate dapat melihat referral, order, komisi pending/tersedia, reversal, serta pencairan.
- Affiliate dapat mengajukan pencairan dengan nominal berapa pun sampai batas saldo tersedia; tidak ada minimum pada V21.
- Admin meninjau permintaan, melakukan transfer manual di luar aplikasi, lalu mencatat nominal, status, waktu, dan referensi/bukti transfer.
- Dana baru dikurangi dari saldo tersedia secara atomik saat permintaan pencairan dibuat. Permintaan yang ditolak/dibatalkan membuat entri kompensasi agar saldo pulih.
- Data rekening penerima disimpan sebagai data payout affiliate dan hanya terlihat oleh affiliate terkait serta admin yang berwenang.

## 4. Arsitektur dan batas data

- Corporate credit menggunakan account ledger yang terikat ke `ClientOrganization`, terpisah dari `UserEntitlement` B2C.
- Order Corporate tetap berada pada boundary pembayaran ReadyScore dan memiliki organization buyer, purchaser user, paket, nominal snapshot, affiliate snapshot, status pembayaran, dan status fulfillment.
- Webhook Midtrans memverifikasi signature, reference, nominal, dan currency seperti alur order existing. Proses fulfillment kredit dan komisi berjalan idempoten dari transisi pembayaran ke PAID.
- B2C affiliate mengaitkan referral ke `CommercialOrder` yang existing; schema lama dan order tanpa affiliate tetap valid.
- Ledger affiliate menyimpan tipe transaksi, jumlah IDR bertanda, status tersedia, sumber order/refund/withdrawal, dan unique idempotency key.
- Hak admin memakai pemeriksaan role/status server-side yang sama dengan area admin ReadyScore; affiliate dan anggota Corporate hanya mengakses data scope miliknya.
- Variabel environment pembayaran tetap memakai konfigurasi Midtrans existing. Tidak ada rahasia atau credential baru disimpan di source.

## 5. Antarmuka dan API

- Workspace Corporate menggunakan label “Corporate”, menyediakan navigasi paket/kredit dan menampilkan saldo, pembelian, serta riwayat perubahan kredit.
- Area Affiliate menyediakan ringkasan link/kode, rate, referral, transaksi, saldo pending/tersedia, informasi payout, dan pengajuan pencairan.
- Area Admin menyediakan manajemen affiliate/rate, ledger dan reversal, daftar permintaan pencairan, serta tindakan menyetujui, menolak, dan mencatat transfer.
- Route handler baru harus menggunakan session server-side, validasi payload, pemeriksaan scope/role, respons error yang tidak membocorkan informasi, dan idempotency untuk mutasi yang dapat diulang.
- Endpoint publik referral hanya mencatat/menyimpan kode referral yang valid; endpoint tidak mengungkap informasi akun atau komisi.

## 6. Urutan phase

1. **Foundation:** schema untuk affiliate, atribusi, Corporate order/paket/kredit, komisi, ledger, payout, serta audit; migration additive dan indeks/unique constraint idempotensi.
2. **Corporate pricing:** katalog paket, API pembelian Midtrans, webhook, pemenuhan kredit 12 bulan, konsumsi/refund kredit saat lifecycle assessment, UI pembelian dan histori.
3. **Referral:** kode/link, cookie/URL 30 hari, persist atribusi ke akun, snapshot referral/rate pada B2C dan Corporate order.
4. **Affiliate operations:** rate management, pending-to-available H+1, refund reversal, halaman affiliate, request payout, halaman admin dan pencatatan transfer manual.
5. **Corporate naming & release hardening:** perbarui UI yang terlihat bagi pengguna, uji regresi lokal, validasi migration lokal, dokumentasi operasi dan prosedur rollout/rollback. Jangan melakukan deploy production.

## 7. Keamanan, kasus tepi, dan penerimaan

- Webhook duplikat, redirect return berulang, dan job H+1 berulang tidak boleh menggandakan kredit atau komisi.
- Order gagal/kedaluwarsa tidak memberi kredit atau komisi. Refund menghasilkan reversal satu kali.
- Notifikasi refund parsial tidak membalik seluruh komisi/kredit; status order tetap PAID dan nilai parsial perlu direkonsiliasi manual sampai ledger mendukung reversal proporsional.
- Referral invalid/expired diabaikan; referral pertama tidak dapat ditimpa oleh referral berikutnya.
- Saldo Corporate tidak boleh negatif karena konsumsi; transaksi kredit dan reserve harus atomik agar undangan paralel tidak menghabiskan satu kredit dua kali.
- Pencairan tidak dapat melampaui saldo tersedia; request concurrent tidak dapat mengunci saldo yang sama dua kali.
- Data order, ledger, dan payout lama tetap dapat dibaca; migration tidak menghapus atau mengubah saldo B2C existing.
- Validasi minimum: Prisma schema/migration, typecheck, build, gate arsitektur V20, skenario Midtrans sukses/gagal/webhook berulang, konsumsi kredit, referral B2C/Corporate, H+1, reversal, payout, akses lintas organisasi/affiliate, dan UI.

## 8. Asumsi operasional

- “H+1” berarti 24 jam setelah timestamp pembayaran PAID; pemindahan pending menjadi tersedia dilakukan secara idempoten saat halaman saldo atau permintaan pencairan dibuka. Belum ada scheduler/cron khusus.
- Transfer pencairan dikerjakan manual oleh admin; V21 tidak mengintegrasikan API disbursement bank.
- Rate affiliate sama untuk seluruh kategori produk milik affiliate dan dapat berbeda antar-affiliate.
- Harga paket yang tercantum adalah harga checkout paket; komisi memakai jumlah yang dibayar setelah diskon, dengan pajak yang tercatat terpisah dikecualikan.
- Nama teknis Client tetap dipertahankan; V21 hanya mengganti copy/label untuk pengguna menjadi Corporate/Perusahaan.
