# ReadyScore --- Product Development Specification, Architecture, Rules & Phase Roadmap

**Status:** LOCKED AS WORKING AGREEMENT\
**Baseline:** V18.3 Production Baseline --- CLOSED\
**Development Mode:** Local-first\
**GitHub:** PAUSED until the agreed V19--V21 work is validated\
**Last Updated:** 2026-09-27

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

# 6. V19.4 --- Profile Integration / Cross-Test Evidence

## Tujuan

Mengintegrasikan evidence dari seluruh assessment yang tersedia ke dalam
**My Profile / Cross-Test Profile** secara konsisten tanpa mengubah makna
assessment sumber.

V19.4 bukan assessment baru.

V19.4 adalah **integration layer** yang membaca hasil assessment yang sudah
tersedia dan memetakannya menjadi evidence profile.

### Assessment Sources

V19.4 harus dapat membaca evidence dari:

-   RIASEC
-   DISC
-   EQ
-   Cognitive
-   Work Attitude
-   Learning Preference

### Architecture

``` text
Assessment Result
       │
       ├── RIASEC
       ├── DISC
       ├── EQ
       ├── Cognitive
       ├── Work Attitude
       └── Learning Preference
              │
              ▼
       Profile Evidence Adapter
              │
              ▼
        My Profile / Evidence Map
              │
              ├── Profile Domains
              ├── Evidence Coverage
              ├── Domain Evidence
              └── Supporting Sources
```

### Prinsip Utama

Profile harus tetap mengikuti prinsip:

> **Evidence, not a single score**

Profile tidak boleh menggabungkan seluruh assessment menjadi satu
**universal score**.

Setiap assessment tetap menjadi sumber evidence dengan makna dan konteks
aslinya.

### Profile Domain

Profile saat ini memiliki domain:

-   Ability
-   Emotional
-   Resilience
-   Behavior
-   Interest
-   Strength
-   Learning

V19.4 harus menentukan secara eksplisit bagaimana setiap assessment
berkontribusi terhadap domain Profile.

**Jangan melakukan mapping hanya berdasarkan kemiripan nama atau asumsi
bahwa dua assessment mengukur konstruk yang sama.**

Work Attitude tidak boleh otomatis dianggap sebagai pengganti atau bagian
dari DISC hanya karena terdapat area yang beririsan.

Learning Preference juga harus diperlakukan sebagai evidence preferensi
belajar, bukan sebagai label kemampuan belajar absolut.

### Evidence Adapter

Setiap assessment yang dikonsumsi Profile harus memiliki mapping/adapter
yang eksplisit.

Minimal adapter harus mendefinisikan:

-   source assessment;
-   source dimensions;
-   target Profile domain;
-   evidence label;
-   evidence strength/meaning jika diperlukan;
-   provenance/source result;
-   aturan ketika evidence tidak tersedia.

### Evidence Coverage

`Evidence Coverage` harus mencerminkan domain Profile yang benar-benar
memiliki evidence.

Domain tanpa evidence:

-   tetap ditampilkan;
-   tidak diberi nilai `0`;
-   ditampilkan sebagai **No evidence / Not available**.

Coverage tidak boleh dihitung berdasarkan jumlah assessment yang selesai
saja jika assessment tersebut tidak menghasilkan evidence untuk domain yang
dimaksud.

### Supporting Sources

Profile harus dapat menunjukkan assessment yang berkontribusi terhadap
evidence.

Contoh:

``` text
Ability
  └── Cognitive

Emotional
  └── EQ

Behavior
  └── DISC

Interest
  └── RIASEC

Work Attitude
  └── [explicit mapping defined in V19.4]

Learning Preference
  └── [explicit mapping defined in V19.4]
```

Mapping final Work Attitude dan Learning Preference harus ditetapkan dalam
implementation V19.4 sebelum dianggap PASS.

### Scope

V19.4 mencakup:

-   Profile evidence model;
-   assessment-to-profile mapping;
-   Profile domain evidence;
-   Evidence Coverage;
-   supporting assessment sources;
-   Profile visualization/data contract;
-   regression terhadap Profile existing.

V19.4 tidak mencakup:

-   Career Advisor;
-   career recommendation engine;
-   WhatsApp;
-   assessment Question Type baru.

Career Advisor tetap V20.

WhatsApp tetap V21.

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

# 8. V21 --- WhatsApp Integration

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

# 9. Phase Order

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
V19.4
Profile Integration
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
  V19.1   Work Attitude          CLOSED / VALIDATED
  V19.2   Learning Preference    PLANNED
  V19.3   Report Adjustment      PLANNED
  V19.4   Profile Integration    PLANNED
  V20     Career Advisor         PLANNED
  V21     WhatsApp Integration   HOLD / PLANNED

------------------------------------------------------------------------

# 10. Development Rules

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

## 10.8 Profile Integration

Profile harus diperlakukan sebagai integration layer, bukan sebagai
assessment baru.

Setiap evidence yang masuk ke Profile harus memiliki source assessment dan
mapping yang eksplisit.

Jangan mengubah score assessment sumber hanya untuk menyesuaikannya dengan
Profile.

Jangan membuat universal score dari seluruh assessment.

Domain tanpa evidence tetap ditampilkan sebagai **No evidence / Not
available**, bukan diberi nilai nol.

## 10.9 Scope Control

Jangan memasukkan Career Advisor ke V19.

Jangan memasukkan WhatsApp ke V19/V20.

Jangan menambahkan Question Type baru di luar V19.1 dan V19.2 tanpa
perubahan kontrak phase.

------------------------------------------------------------------------

# 11. Definition of Done

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

## V19.4

PASS jika:

-   My Profile membaca evidence dari assessment yang tersedia;
-   mapping assessment-to-profile eksplisit dan terdokumentasi;
-   Work Attitude memiliki mapping Profile yang tervalidasi;
-   Learning Preference memiliki mapping Profile yang tervalidasi;
-   Evidence Coverage dihitung dari evidence yang tersedia;
-   domain tanpa evidence tidak dianggap sebagai score 0;
-   supporting assessment sources dapat ditampilkan;
-   Profile visualization/data contract berjalan;
-   existing assessment, result, dan report tetap regression-safe.

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

# 12. Immediate Next Step

**V19.1 --- Work Attitude sudah tervalidasi secara lokal melalui
typecheck, build, runtime assessment, submit, scoring, dan result.**

Phase berikutnya:

**Mulai V19.2 --- Learning Preference.**

Setelah V19.2 dan V19.3 selesai, V19.4 menjadi integration phase untuk
menggabungkan evidence assessment ke My Profile.

Tidak perlu menyentuh WhatsApp sampai V21.

------------------------------------------------------------------------

# 13. Contract Summary

``` text
V18.3 = Stable Production Baseline
V19   = Assessment Expansion + Report Alignment + Profile Integration
V20   = Career Advisor
V21   = WhatsApp Integration
```

**V19.1 --- Work Attitude = locally validated.**

**Next development phase: V19.2 --- Learning Preference.**

**V19.4 = Profile Integration / Cross-Test Evidence.**

**WhatsApp remains HOLD until the Meta dependency is resolved.**
