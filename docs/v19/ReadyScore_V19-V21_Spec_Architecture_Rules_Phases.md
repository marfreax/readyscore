# ReadyScore --- Product Development Specification, Architecture, Rules & Phase Roadmap

**Status:** LOCKED AS WORKING AGREEMENT\
**Baseline:** V18.3 Production Baseline --- CLOSED\
**Development Mode:** Local-first\
**GitHub:** PAUSED until the agreed V19--V21 work is validated\
**Last Updated:** 2026-09-26

------------------------------------------------------------------------

## 1. Purpose

Dokumen ini menjadi kontrak kerja pengembangan ReadyScore untuk fase
setelah V18.3.

Fokus utama:

1.  memperluas jenis assessment/question;
2.  menyempurnakan report;
3.  membangun Career Advisor;
4.  menyelesaikan integrasi WhatsApp setelah dependency Meta siap.

Prinsip utama: **jangan memperluas scope tanpa kebutuhan yang jelas.**

------------------------------------------------------------------------

# 2. Current Product Assessment Types

ReadyScore saat ini memiliki 4 jenis assessment:

1.  **RIASEC** --- minat karier
2.  **DISC** --- kecenderungan perilaku
3.  **EQ** --- kecenderungan emosional
4.  **Cognitive** --- kemampuan kognitif

V19 akan menambahkan:

5.  **Work Attitude**
6.  **Learning Preference**

Sehingga target setelah V19 adalah **6 assessment types**.

------------------------------------------------------------------------

# 3. Architecture Principle

Setiap Question Type baru harus mengikuti architecture/pipeline
ReadyScore yang sudah ada dan tidak membuat jalur runtime khusus tanpa
alasan yang kuat.

### Standard Assessment Pipeline

``` text
Question
   ↓
Question Type
   ↓
Question Package
   ↓
Configuration
   ↓
Assessment Runtime
   ↓
Scoring
   ↓
Result
   ↓
Report
```

### Prinsip

-   Reuse architecture yang sudah PASS.
-   Jangan mengubah architecture existing hanya karena Question Type
    baru.
-   Question Type harus memiliki taxonomy/scoring/selection yang jelas.
-   Package dan configuration harus dapat diverifikasi secara
    independen.
-   Runtime harus tetap menggunakan mekanisme yang konsisten dengan
    assessment existing.
-   Perubahan database hanya dilakukan jika benar-benar diperlukan.
-   Setiap perubahan harus regression-aware terhadap V18.3.

------------------------------------------------------------------------

# 4. V19 --- Assessment Expansion & Report Alignment

## V19.1 --- Work Attitude

### Tujuan

Menambahkan assessment untuk mengukur kecenderungan sikap kerja.

### Konstruk awal

Berdasarkan referensi report yang telah dibahas, aspek yang menjadi
acuan:

-   Sistematika Kerja
-   Pola Berpikir
-   Pengambilan Keputusan
-   Kerjasama
-   Interaksi Sosial
-   Penyesuaian Diri
-   Kedisiplinan

### Catatan

Work Attitude bukan pengganti DISC.

Walaupun terdapat area yang beririsan dengan DISC, Work Attitude harus
diperlakukan sebagai Question Type/instrument tersendiri dengan
taxonomy, scoring, dan interpretasi sendiri.

### Output

Minimal menghasilkan:

-   skor/dimensi;
-   interpretasi setiap dimensi;
-   ringkasan kecenderungan;
-   data yang dapat digunakan oleh report;
-   data yang nantinya dapat dibaca oleh Career Advisor.

------------------------------------------------------------------------

## V19.2 --- Learning Preference

### Tujuan

Menambahkan assessment untuk mengukur kecenderungan/preferensi belajar.

### Konstruk awal

-   Visual
-   Auditory
-   Kinesthetic

### Terminologi

Gunakan **Learning Preference / Preferensi Belajar**, bukan menjadikan
hasil sebagai label absolut bahwa seseorang hanya dapat belajar dengan
satu cara tertentu.

Hasil harus diposisikan sebagai **kecenderungan/preferensi**, bukan
batas kemampuan belajar.

### Output

Minimal menghasilkan:

-   persentase/skor tiap preference;
-   preference dominan;
-   interpretasi;
-   ringkasan;
-   data yang dapat digunakan oleh report;
-   data yang nantinya dapat dibaca oleh Career Advisor.

------------------------------------------------------------------------

# 5. V19.3 --- Report Adjustment

## Tujuan

Menyesuaikan reporting layer ReadyScore agar mendukung seluruh
assessment yang sudah ada dan dua assessment baru.

Scope tidak hanya PDF.

### Reporting Layer

``` text
Assessment Result
       │
       ├── Result Page / Web
       ├── Interpretation
       ├── Visualization
       ├── Recommendation
       └── PDF Report
```

### V19.3 harus memastikan

-   hasil assessment baru tampil dengan benar;
-   interpretasi konsisten;
-   visualisasi sesuai konstruk;
-   report web dan PDF konsisten;
-   struktur report tidak merusak assessment existing;
-   RIASEC, DISC, EQ, dan Cognitive tetap regression-safe;
-   data Work Attitude dan Learning Preference tersedia untuk kebutuhan
    V20.

### Non-goal

V19.3 **tidak membangun Career Advisor**.

Career Advisor masuk V20.

------------------------------------------------------------------------

# 6. V20 --- Career Advisor

## Tujuan

Membangun layer advisor yang melakukan synthesis terhadap hasil
assessment.

Career Advisor memanfaatkan data dari:

-   RIASEC
-   DISC
-   EQ
-   Cognitive
-   Work Attitude
-   Learning Preference

### Prinsip

Career Advisor tidak menggantikan assessment.

Assessment menghasilkan data/profile.

Career Advisor melakukan synthesis dan menyajikan insight/rekomendasi
karier berdasarkan data assessment yang tersedia.

### Architecture

``` text
RIASEC
DISC
EQ
Cognitive
Work Attitude
Learning Preference
        │
        ▼
   Career Profile
        │
        ▼
  Career Advisor
        │
        ▼
Career Insights / Recommendations
```

------------------------------------------------------------------------

# 7. V21 --- WhatsApp Integration

V21 adalah pengembangan yang sebelumnya direncanakan sebagai
V18.4--V18.6.

### Status

**HOLD --- External Dependency**

V21 tidak menghalangi development V19 dan V20.

### Scope awal

-   Meta Cloud API integration
-   WhatsApp outbound delivery
-   PDF delivery
-   webhook
-   provider error handling
-   outbound idempotency
-   delivery status
-   failure handling
-   regression terhadap Free Assessment delivery

### Important Architecture Rule

Runtime provider ReadyScore tetap diarahkan ke **Meta Cloud API**.

Kirimi/WABA Coexistence merupakan bagian dari konfigurasi/infrastruktur
WhatsApp, bukan alasan untuk mengganti architecture ReadyScore menjadi
Kirimi QR/device API.

### V21 dimulai ketika

-   status Meta/WABA sudah jelas;
-   access/authorization sudah tersedia;
-   real outbound API dapat divalidasi.

Pada saat V21 dimulai, kondisi Meta terbaru harus diaudit kembali.
Jangan menggunakan asumsi lama sebagai fakta baru.

------------------------------------------------------------------------

# 8. Phase Order

Urutan phase yang dikunci:

``` text
V18.3
Production Baseline
CLOSED
   │
   ▼
V19.1
Work Attitude
   │
   ▼
V19.2
Learning Preference
   │
   ▼
V19.3
Report Adjustment
   │
   ▼
V20
Career Advisor
   │
   ▼
V21
WhatsApp Integration
```

### Status

  Phase   Scope                  Status
  ------- ---------------------- ----------------
  V18.3   Production Baseline    CLOSED
  V19.1   Work Attitude          NEXT
  V19.2   Learning Preference    PLANNED
  V19.3   Report Adjustment      PLANNED
  V20     Career Advisor         PLANNED
  V21     WhatsApp Integration   HOLD / PLANNED

------------------------------------------------------------------------

# 9. Development Rules

## 9.1 Local First

Semua development baru dimulai dan divalidasi secara lokal.

Jangan push ke GitHub sebelum phase yang bersangkutan selesai
divalidasi.

## 9.2 No Premature PASS

Jangan menyatakan phase PASS hanya karena source sudah berubah.

PASS membutuhkan validation aktual.

## 9.3 Preserve Stable Baseline

V18.3 adalah production baseline.

V19 dan V20 tidak boleh merusak behavior yang sudah berjalan pada V18.3.

## 9.4 No Blind Patching

Jika terjadi error:

1.  identifikasi root cause;
2.  tentukan apakah masalah source, data, configuration, atau external
    dependency;
3.  patch hanya pada layer yang terbukti bermasalah;
4.  regression test setelah patch.

## 9.5 Database

-   Jangan membuat migration tanpa kebutuhan nyata.
-   Jika schema berubah, migration harus eksplisit.
-   Existing production data harus dianggap protected.
-   Jangan melakukan destructive database operation tanpa alasan dan
    verification.

## 9.6 Question Type

Question Type baru harus memiliki:

-   definition;
-   taxonomy/dimensions;
-   question package;
-   selection rules;
-   scoring rules;
-   result mapping;
-   interpretation;
-   report mapping.

## 9.7 Report

Setiap perubahan report harus regression-aware terhadap:

-   Result Page;
-   PDF;
-   existing assessment types;
-   Free Assessment flow jika terdampak.

## 9.8 Scope Control

Jangan memasukkan Career Advisor ke V19.

Jangan memasukkan WhatsApp ke V19/V20.

Jangan menambahkan Question Type baru di luar V19.1 dan V19.2 tanpa
perubahan kontrak phase.

------------------------------------------------------------------------

# 10. Definition of Done

## V19.1

PASS jika:

-   Work Attitude Question Type tersedia;
-   package/configuration/runtime berjalan;
-   scoring benar;
-   result benar;
-   report mapping tersedia;
-   existing assessments tetap regression-safe.

## V19.2

PASS jika:

-   Learning Preference Question Type tersedia;
-   Visual/Auditory/Kinesthetic dapat dihitung;
-   result benar;
-   report mapping tersedia;
-   existing assessments tetap regression-safe.

## V19.3

PASS jika:

-   Web result benar;
-   interpretation benar;
-   visualization benar;
-   PDF benar;
-   assessment existing tidak rusak;
-   output V19 siap dikonsumsi V20.

## V20

PASS jika:

-   Career Profile dapat dibentuk dari assessment yang tersedia;
-   Career Advisor dapat melakukan synthesis;
-   recommendation layer berjalan;
-   existing assessment/runtime/report tidak rusak.

## V21

PASS jika:

-   Meta provider dapat diakses;
-   outbound text/document berjalan;
-   webhook berjalan;
-   delivery status tersimpan;
-   idempotency berjalan;
-   failure handling berjalan;
-   Free Assessment delivery regression-safe.

------------------------------------------------------------------------

# 11. Immediate Next Step

**Mulai V19.1 --- Work Attitude.**

Sebelum implementation:

1.  lock konstruk/dimensi;
2.  tentukan question model;
3.  tentukan scoring;
4.  tentukan taxonomy;
5.  tentukan package;
6.  tentukan result interpretation;
7.  baru implement ke existing architecture.

Tidak perlu menyentuh WhatsApp sampai V21.

------------------------------------------------------------------------

# 12. Contract Summary

``` text
V18.3 = Stable Production Baseline
V19   = Assessment Expansion + Report Alignment
V20   = Career Advisor
V21   = WhatsApp Integration
```

**Development priority saat ini: V19.1 --- Work Attitude.**

**WhatsApp remains HOLD until the Meta dependency is resolved.**
