# ReadyScore V10.5 — Assessment Workspace

## Core Definition

> Assessments = tempat user mengetahui assessment apa yang bisa dan tidak bisa dikerjakan.

Konsep “Pilih assessment Anda” tidak lagi menjadi pusat UX. Workspace berorientasi pada state dan next action.

## Required Status Groups

### Available
User dapat mulai.
CTA: **Start**

### In Progress
User sudah memulai.
CTA: **Continue**

### Completed
User sudah selesai.
CTA: **View result** bila existing result access tersedia.
Jika result access tidak tersedia, gunakan **Get access**.

### Locked / Unavailable
User belum memiliki entitlement.
CTA: **Get access**.

Locked assessment boleh ditampilkan untuk discovery, transparency, dan conversion, tetapi UI tidak memberikan entitlement baru.

## Data Sources

Gunakan service existing:
- `getUserHistory`
- `listUserEntitlements`
- `CUSTOMER_ASSESSMENT_CATALOG`

Tidak membuat state database baru.

## Route Boundary

- `/assessments` = Assessment Workspace
- `/assessments/[type]` = About Assessment
- `/assessments/[type]/pre-test` = Pre-Test
- `/assessments/[type]/test` = existing assessment runtime
- `/result/[attemptId]` = individual result
- `/access` = access / plans
- existing reassessment flow tetap menjadi source of truth untuk retake/reassessment.

## Measurement Safety

Workspace hanya mempresentasikan existing state. Tidak ada scoring, measurement, interpretation, entitlement, persistence, atau assessment-runtime redesign.

## Definition of Done

- status groups tersedia sesuai existing activity + entitlement
- CTA sesuai status
- locked state tidak fake-unlock
- existing routes dipertahankan
- About/Pre-Test/runtime/result flow tetap digunakan
- no migration
- no measurement/scoring mutation
- no universal score/raw-average synthesis
- typecheck/build/runtime evidence harus lulus pada acceptance
