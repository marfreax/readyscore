# ReadyScore --- PHASE 2.15.3

## Question Bank → PostgreSQL Runtime Integration

**Status:** PLANNED / READY FOR IMPLEMENTATION\
**Prerequisite:** PHASE 2.15.1 --- PostgreSQL & Prisma Database
Foundation\
**Prerequisite:** PHASE 2.15.2 --- Core Assessment Database Schema

------------------------------------------------------------------------

## 1. Objective

Migrasikan runtime Question Bank dari in-memory/static storage menjadi
PostgreSQL-backed runtime menggunakan Prisma.

PostgreSQL harus menjadi **single source of truth** untuk:

1.  Question Bank
2.  Mapping
3.  Question approval
4.  Publishing
5.  Eligibility
6.  Assessment question selection
7.  Assessment attempt
8.  Answers
9.  Assessment result

Phase ini tidak mengubah business rule yang sudah locked pada phase
sebelumnya.

------------------------------------------------------------------------

## 2. Constraints

1.  Jangan menghapus fitur existing.
2.  Jangan mengubah UI existing kecuali diperlukan agar runtime DB
    bekerja.
3.  Jangan mengubah scoring algorithm existing.
4.  Jangan mengubah assessment configuration existing.
5.  Jangan mengubah Free/Premium question count.
6.  Free assessment tetap menggunakan random 20 soal.
7.  Free dan Premium menggunakan Question Bank yang sama.
8.  Jangan membuat Question Bank khusus Free.
9.  Question selection harus mengambil dari published + eligible
    questions.
10. Attempt harus memiliki immutable snapshot.
11. Perubahan Question Bank setelah assessment dimulai tidak boleh
    mengubah attempt berjalan.
12. Answer tidak boleh bergantung pada in-memory persistence.
13. Jangan menggunakan global Map/array sebagai persistence mechanism.
14. Jangan membuat database kedua.
15. Jangan membuat migration destructive.
16. Gunakan Prisma existing.
17. Gunakan PostgreSQL dari `.env`.
18. Pertahankan migration history.
19. Semua perubahan schema dilakukan melalui Prisma migration.
20. Gunakan full-file replacement bila melakukan implementasi dengan
    coding agent; hindari instruksi edit manual baris demi baris.

------------------------------------------------------------------------

# 3. Step 0 --- Inspect Current Codebase

Sebelum implementasi, inspect:

-   `prisma/schema.prisma`
-   `prisma/migrations/*`
-   `lib/question-bank-admin.ts`
-   `lib/question-bank-csv.ts`
-   `lib/assessment/question-bank.ts`
-   `lib/assessment/runtime-service.ts`
-   `lib/assessment/runtime-store.ts`
-   `lib/assessment/types.ts`
-   `lib/assessment-config.ts`
-   scoring service / scoring implementation
-   `app/api/admin/question-bank/*`
-   `app/api/assessment/*`
-   existing Question Bank UI
-   existing assessment UI
-   existing result implementation

Cari seluruh penggunaan:

-   `Question`
-   `AdminQuestion`
-   `getQuestions`
-   `importAdminQuestions`
-   `publishQuestion`
-   `unpublishQuestion`
-   `approveQuestion`
-   `approveMapping`
-   `mappingStatus`
-   `status`
-   `eligible`
-   `startAssessment`
-   `saveAnswer`
-   `submitAssessment`

Jangan mengasumsikan struktur schema. Gunakan schema existing sebagai
authority.

------------------------------------------------------------------------

# 4. Step 1 --- Database Model Reconciliation

Review model yang dibuat pada PHASE 2.15.2.

Pastikan model yang diperlukan untuk runtime memiliki representasi
database yang cukup untuk:

### Question

-   id
-   code
-   text
-   domain
-   subdomain
-   indicator
-   type
-   reverseScore
-   weight
-   scale
-   scoringKey
-   difficulty
-   status
-   mappingStatus
-   sourceFile
-   createdAt
-   updatedAt

Mapping harus persistent.

Question lifecycle minimal:

``` text
DRAFT
  ↓
MAPPED
  ↓
APPROVED
  ↓
PUBLISHED
```

Eligibility harus dapat ditentukan secara deterministic.

Jika enum sudah tersedia, gunakan enum existing. Jangan menyebarkan
string comparison ke banyak tempat.

------------------------------------------------------------------------

# 5. Step 2 --- Question Bank Repository

Buat repository/service khusus database Question Bank.

Prefer:

``` text
lib/question-bank-repository.ts
```

atau struktur repository equivalent yang sesuai dengan codebase.

Minimal API:

``` text
getQuestionById(id)
getQuestions(params)
countQuestions(params)
createQuestion(input)
updateQuestion(id, input)
bulkCreateQuestions(input)
updateMapping(id, input)
approveMapping(id)
approveQuestion(id)
publishQuestion(id)
unpublishQuestion(id)
getPublishedEligibleQuestions()
getQuestionBankStats()
```

UI/API tidak boleh melakukan Prisma query langsung di banyak tempat.

Persistence Question Bank harus terpusat.

------------------------------------------------------------------------

# 6. Step 3 --- Refactor `question-bank-admin.ts`

Existing:

``` text
lib/question-bank-admin.ts
```

harus menjadi service/facade yang menggunakan repository PostgreSQL.

Pertahankan public API existing sebanyak mungkin.

Contoh:

``` text
approveQuestion()
    → repository.approveQuestion()

approveMapping()
    → repository.approveMapping()

publishQuestion()
    → repository.publishQuestion()

unpublishQuestion()
    → repository.unpublishQuestion()

getAdminQuestions()
    → repository.getQuestions()

getStats()
    → repository.getQuestionBankStats()
```

Jangan lagi menggunakan in-memory array sebagai persistent store.

Jika terdapat `Map`, array, atau module-level storage sebagai
persistence mechanism, hapus dependency tersebut dari critical runtime
path.

------------------------------------------------------------------------

# 7. Step 4 --- CSV Import → PostgreSQL

Existing:

``` text
lib/question-bank-csv.ts
```

tetap bertugas:

``` text
CSV
 ↓
parse
 ↓
validate
 ↓
normalize
```

Setelah parsing:

``` text
ImportedQuestion[]
 ↓
PostgreSQL
```

Upload route:

``` text
app/api/admin/question-bank/upload/route.ts
```

harus:

1.  menerima CSV
2.  parse
3.  validate
4.  normalize
5.  persist ke PostgreSQL
6.  return import summary

Question hasil upload harus masuk sebagai:

``` text
status = DRAFT
```

Jika mapping tersedia dari CSV, gunakan hasil mapping tersebut.

Jika belum lengkap:

``` text
mappingStatus = PARTIAL
```

Jangan otomatis publish.

------------------------------------------------------------------------

# 8. Step 5 --- APPEND / REPLACE Semantics

Pertahankan semantics existing:

``` text
APPEND
REPLACE
```

### APPEND

-   tambah/update sesuai semantics existing
-   jangan menghapus existing questions

### REPLACE

Gunakan semantics existing secara aman.

Jangan melakukan destructive database reset.

Jangan menghapus published questions secara tidak sengaja.

Jika diperlukan, gunakan:

``` ts
prisma.$transaction(...)
```

untuk operasi multi-record.

------------------------------------------------------------------------

# 9. Step 6 --- Admin Question Bank API

Endpoint:

``` text
GET /api/admin/question-bank
```

harus membaca PostgreSQL.

Response contract frontend existing harus dipertahankan sebisa mungkin.

Stats harus berasal dari database:

-   total
-   partial
-   mapped
-   published
-   eligible

Jangan menghitung stats dari hardcoded question array.

------------------------------------------------------------------------

# 10. Step 7 --- Mapping Persistence

Endpoint:

``` text
/api/admin/question-bank/[questionId]/mapping
```

harus update PostgreSQL.

Fields:

-   domain
-   subdomain
-   indicator

harus persistent.

Acceptance:

1.  mapping question
2.  refresh browser
3.  mapping tetap ada
4.  restart Next.js
5.  mapping tetap ada

------------------------------------------------------------------------

# 11. Step 8 --- Approval Persistence

Endpoint:

``` text
/approve
/mapping-approve
/publish
/unpublish
```

semuanya harus PostgreSQL-backed.

State transition harus persistent.

Jangan mengubah lifecycle yang sudah disepakati pada PHASE 2.8 / 2.8.1.

------------------------------------------------------------------------

# 12. Step 9 --- Assessment Question Selection

Ini adalah bagian paling penting.

Existing:

``` text
lib/assessment/question-bank.ts
lib/assessment/runtime-service.ts
```

tidak boleh lagi menggunakan static/in-memory Question Bank sebagai
source of truth.

Buat database-backed selector.

Prefer:

``` text
lib/assessment/question-selector.ts
```

Selector harus:

1.  query PostgreSQL
2.  hanya mengambil published questions
3.  hanya mengambil eligible questions
4.  melakukan random selection
5.  memastikan jumlah sesuai assessment configuration
6.  tidak duplicate dalam satu attempt
7.  mengembalikan immutable selected question set

------------------------------------------------------------------------

# 13. Free Assessment

Free assessment:

-   20 questions
-   random
-   menggunakan Question Bank utama
-   tidak ada Question Bank khusus Free
-   selection berasal dari eligible published bank sesuai rules existing

Jangan membuat:

``` text
free_question = true
```

atau bank terpisah.

------------------------------------------------------------------------

# 14. Premium Assessment

Premium:

-   menggunakan Question Bank yang sama
-   menggunakan eligibility yang sama
-   mengikuti assessment configuration existing
-   menggunakan database-backed selection

Jangan mengubah business rule Premium yang sudah locked.

------------------------------------------------------------------------

# 15. Step 10 --- Immutable Attempt Snapshot

Ketika:

``` text
POST /api/assessment/start
```

dipanggil:

1.  query eligible questions dari PostgreSQL
2.  random select
3.  create AssessmentAttempt
4.  create selected question records/snapshot
5.  simpan metadata question yang diperlukan

Setelah attempt dibuat:

``` text
AssessmentAttempt
    ↓
Immutable Selected Questions
```

Perubahan Question Bank setelah itu:

-   publish
-   unpublish
-   edit mapping
-   edit question

tidak boleh mengubah attempt berjalan.

Assessment membaca question dari snapshot attempt.

------------------------------------------------------------------------

# 16. Step 11 --- Answer Persistence

Endpoint:

``` text
POST /api/assessment/[attemptId]/answer
```

harus menyimpan answer ke PostgreSQL.

Jangan menggunakan:

``` text
Map<questionId, answer>
```

sebagai persistence.

Behavior:

``` text
new answer
    → create

existing answer
    → update / upsert
```

Acceptance:

-   save answer
-   refresh browser
-   answer tetap ada
-   navigate away
-   return
-   answer tetap ada
-   restart Next.js
-   answer tetap ada

------------------------------------------------------------------------

# 17. Step 12 --- Attempt State Persistence

Attempt status harus PostgreSQL-backed.

Minimal:

``` text
IN_PROGRESS
COMPLETED
ABANDONED
```

Endpoint:

``` text
GET /api/assessment/[attemptId]
```

harus membaca database.

Jangan mengambil attempt dari runtime-store memory.

------------------------------------------------------------------------

# 18. Step 13 --- Submit

Endpoint:

``` text
POST /api/assessment/[attemptId]/submit
```

harus:

1.  load attempt dari PostgreSQL
2.  load selected questions dari snapshot
3.  load answers dari PostgreSQL
4.  validate completeness
5.  calculate result menggunakan scoring implementation existing
6.  persist result
7.  mark attempt `COMPLETED`
8.  return result

Gunakan transaction bila diperlukan.

### Idempotency

Jika attempt sudah `COMPLETED`:

-   jangan menghitung result berbeda
-   return existing persisted result
-   jangan membuat duplicate result

------------------------------------------------------------------------

# 19. Step 14 --- Remove Runtime Store Dependency

Evaluasi:

``` text
lib/assessment/runtime-store.ts
```

Jika hanya digunakan sebagai in-memory persistence:

-   deprecate atau remove dependency tersebut
-   runtime service harus menggunakan PostgreSQL repository

Target architecture:

``` text
API
 ↓
Assessment Runtime Service
 ↓
PostgreSQL Repository
 ↓
Prisma
 ↓
PostgreSQL
```

Bukan:

``` text
API
 ↓
Runtime Service
 ↓
Map / Array
```

------------------------------------------------------------------------

# 20. Step 15 --- Seed / Migrate Existing 1,825 Questions

Ini **WAJIB**.

Current Question Bank UI menunjukkan:

``` text
1,825 questions
```

Jangan membuat database kosong lalu menganggap phase selesai.

Cari source existing 1.825 questions di codebase.

Kemungkinan:

-   static data
-   imported CSV
-   existing question-bank data
-   generated source

Gunakan source existing.

Target:

``` text
Existing Question Source
        ↓
Normalize
        ↓
Upsert PostgreSQL
```

Seed/import harus idempotent.

Jika `code` adalah unique identifier existing, gunakan `code` sebagai
natural unique key.

Running seed dua kali tidak boleh membuat duplicate.

Acceptance:

``` text
database question count = 1,825
```

atau sama dengan jumlah aktual source existing.

------------------------------------------------------------------------

# 21. Data Integrity Rule

Setelah phase ini:

``` text
Question Bank UI
        ↓
PostgreSQL

Assessment Start
        ↓
PostgreSQL

Assessment Attempt
        ↓
PostgreSQL

Answer
        ↓
PostgreSQL

Result
        ↓
PostgreSQL
```

Tidak boleh ada:

``` text
Question Bank UI
        ↓
In-memory array

Assessment
        ↓
different in-memory array
```

Admin dan Assessment harus menggunakan dataset yang sama.

------------------------------------------------------------------------

# 22. API Contract Compatibility

Existing frontend harus tetap dapat:

-   load Question Bank
-   filter
-   search
-   select
-   mapping
-   approve
-   publish
-   start assessment
-   answer
-   submit
-   view result

Jika backend membutuhkan perubahan response, update frontend dalam phase
yang sama.

Jangan meninggalkan API setengah migrasi.

------------------------------------------------------------------------

# 23. Error Handling

Minimal error code:

``` text
DATABASE_UNAVAILABLE
QUESTION_NOT_FOUND
QUESTION_ALREADY_EXISTS
INVALID_MAPPING
INVALID_STATE_TRANSITION
NO_ELIGIBLE_QUESTIONS
INSUFFICIENT_ELIGIBLE_QUESTIONS
ATTEMPT_NOT_FOUND
ATTEMPT_NOT_IN_PROGRESS
```

Jangan expose raw Prisma error ke browser.

------------------------------------------------------------------------

# 24. Transaction Safety

Gunakan Prisma transaction untuk operasi yang membutuhkan atomicity:

-   bulk import
-   mapping bulk update
-   approval bulk update
-   publish bulk update
-   assessment start + selected questions
-   submit + result + attempt completion

Read-only operations tidak perlu transaction kecuali diperlukan.

------------------------------------------------------------------------

# 25. Performance

Current dataset:

``` text
~1,825 questions
```

Untuk assessment:

Jangan load seluruh question bank ke browser.

Assessment hanya membutuhkan N questions.

Database-side selection dapat menggunakan:

``` sql
ORDER BY RANDOM()
LIMIT N
```

atau equivalent yang aman untuk ukuran dataset ini.

Admin Question Bank gunakan pagination.

Jangan mengirim seluruh 1.825 records ke browser jika pagination sudah
tersedia.

------------------------------------------------------------------------

# 26. Logging

Jika diperlukan, gunakan structured server-side logging untuk:

-   question bank import
-   question publish
-   assessment start
-   assessment submit

Jangan log:

-   password
-   session secret
-   sensitive answer detail jika tidak diperlukan

------------------------------------------------------------------------

# 27. Verification Tests

## A. Question Bank

1.  GET Question Bank
2.  total \> 0
3.  stats berasal dari DB

## B. Persistence

1.  mapping question
2.  refresh
3.  mapping tetap ada

## C. Publishing

1.  publish question
2.  refresh
3.  published tetap ada

## D. Assessment Selection

1.  start free
2.  mendapatkan 20 questions
3.  questions berasal dari DB
4.  tidak duplicate

## E. Snapshot

1.  start assessment
2.  unpublish salah satu selected question
3.  attempt tetap dapat membaca question tersebut

## F. Answer

1.  save answer
2.  refresh
3.  answer tetap ada

## G. Submit

1.  answer all
2.  submit
3.  result tersimpan
4.  attempt menjadi COMPLETED

## H. Idempotency

1.  submit ulang
2.  result sama
3.  tidak membuat duplicate result

------------------------------------------------------------------------

# 28. Validation Commands

Setelah implementation:

``` bash
pnpm db:validate
pnpm db:format
pnpm db:generate
pnpm typecheck
pnpm build
pnpm prisma migrate status
```

Expected:

``` text
db:validate  → PASS
db:generate  → PASS
typecheck    → PASS
build        → PASS
migration    → CLEAN
database     → CONNECTED
question     → > 0
```

------------------------------------------------------------------------

# 29. Runtime Verification

Start:

``` bash
pnpm dev
```

Open:

``` text
http://localhost:3000/admin/question-bank
```

Expected:

-   Question Bank loads from PostgreSQL
-   current question count remains available
-   mapping works
-   approval works
-   publish works

Then:

``` text
http://localhost:3000/trial
```

Click:

``` text
Mulai Assessment Gratis
```

Expected:

``` text
20 questions
```

Then:

1.  answer at least one question
2.  refresh
3.  answer remains
4.  complete assessment
5.  result persists
6.  restart Next.js
7.  reopen attempt/result
8.  data remains

------------------------------------------------------------------------

# 30. Definition of Done

PHASE 2.15.3 hanya PASS jika:

-   [ ] PostgreSQL menjadi source of truth
-   [ ] 1,825 existing questions persisted
-   [ ] Admin Question Bank membaca PostgreSQL
-   [ ] CSV upload persist ke PostgreSQL
-   [ ] Mapping persist ke PostgreSQL
-   [ ] Approval persist ke PostgreSQL
-   [ ] Publishing persist ke PostgreSQL
-   [ ] Eligibility database-backed
-   [ ] Assessment selection membaca PostgreSQL
-   [ ] Free memilih 20 random questions
-   [ ] Free/Premium menggunakan Question Bank yang sama
-   [ ] Attempt selected questions menjadi immutable snapshot
-   [ ] Answers persist ke PostgreSQL
-   [ ] Attempt status persist ke PostgreSQL
-   [ ] Result persist ke PostgreSQL
-   [ ] Restart tidak menghilangkan data
-   [ ] Critical runtime tidak bergantung pada in-memory persistence
-   [ ] `pnpm db:validate` PASS
-   [ ] `pnpm db:generate` PASS
-   [ ] `pnpm typecheck` PASS
-   [ ] `pnpm build` PASS
-   [ ] Existing UI tetap functional

------------------------------------------------------------------------

# 31. Target Architecture

``` text
                         ┌──────────────────────┐
                         │      PostgreSQL      │
                         │                      │
                         │  Question Bank       │
                         │  Mapping             │
                         │  Approval             │
                         │  Publishing           │
                         │  Attempts             │
                         │  Answers              │
                         │  Results              │
                         └──────────┬───────────┘
                                    │
                              Prisma Layer
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
          Question Bank Repository          Assessment Repository
                  │                                   │
                  ▼                                   ▼
          Question Bank Admin              Assessment Runtime
                  │                                   │
                  │                         ┌─────────┴─────────┐
                  │                         │                   │
                  │                         ▼                   ▼
                  │                  Question Selector       Attempt
                  │                         │                   │
                  │                         ▼                   ▼
                  │                   20 Random Questions   Answers
                  │                                             │
                  └──────────────────────────────┬──────────────┘
                                                 ▼
                                               Result
```

------------------------------------------------------------------------

## Phase Boundary

**PHASE 2.15.3 tidak dianggap selesai hanya karena TypeScript dan build
PASS.**

Minimum runtime proof:

``` text
1,825 questions
       ↓
PostgreSQL
       ↓
Admin Question Bank
       ↓
Published + Eligible
       ↓
/trial
       ↓
20 random questions
       ↓
Attempt Snapshot
       ↓
Answer Persistence
       ↓
Submit
       ↓
Persisted Result
```

Setelah seluruh acceptance criteria di atas PASS, phase dapat di-LOCK
dan baru dilanjutkan ke phase berikutnya.
