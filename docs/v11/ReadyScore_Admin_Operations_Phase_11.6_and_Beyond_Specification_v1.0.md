# ReadyScore --- Admin Operations Development Specification & Roadmap

## Phase 11.6 and Beyond

**Document:** ReadyScore Admin Operations Development Specification &
Roadmap\
**Version:** 1.0\
**Baseline:** V11.5 FROZEN\
**Status:** READY FOR DEVELOPMENT\
**Scope:** Admin Operations, Productivity, Governance, Auditability,
Data Navigation\
**Primary principle:** Improve operator capability without changing
customer measurement, scoring, result semantics, entitlement semantics,
or historical reality.

------------------------------------------------------------------------

# 1. PURPOSE

Dokumen ini menjadi spesifikasi induk untuk development ReadyScore
setelah V11.5.

V11.5 ditetapkan sebagai **frozen baseline**. Seluruh phase setelahnya
harus memperlakukan V11.5 sebagai fondasi yang sudah diterima dan tidak
boleh mengubah semantics customer yang telah dikunci.

Phase 11.6 yang didefinisikan dalam dokumen ini adalah **phase baru**.
Ia tidak sama dengan eksperimen V11.6 Full Admin + Customer Regression
yang sebelumnya dibatalkan.

Phase baru dimulai dari kebutuhan nyata yang terlihat pada V11.5:

-   audit event sudah tersimpan tetapi belum memiliki Audit Workspace
    khusus;
-   dashboard hanya menampilkan recent activity;
-   data admin belum memiliki pagination operasional yang memadai;
-   search/filter belum dibangun sebagai pola data workspace yang
    konsisten;
-   operator membutuhkan navigasi data yang scalable;
-   governance sudah ada, tetapi observability dan productivity layer
    belum lengkap.

------------------------------------------------------------------------

# 2. BASELINE V11.5

## 2.1 Yang dianggap sudah ada

V11.5 menyediakan fondasi:

-   Admin Architecture & Safety Contract;
-   Question Bank Operations;
-   Assessment Configuration Governance;
-   Review & Publishing Governance;
-   Admin Operations Dashboard;
-   Users & Access Operations;
-   server-side admin authorization;
-   lifecycle protection;
-   high-impact confirmation;
-   immutable `AdminContentAuditEvent`;
-   audit recording untuk material content operations;
-   audit recording untuk user/access operations;
-   historical safety boundary.

## 2.2 Yang tidak boleh dianggap selesai

V11.5 belum berarti:

-   tersedia halaman `/admin/audit`;
-   tersedia audit browser dengan search/filter;
-   tersedia pagination reusable untuk seluruh admin;
-   tersedia global admin search;
-   tersedia bulk operations;
-   seluruh admin list sudah scalable untuk pertumbuhan data;
-   seluruh operational mutation sudah mempunyai workspace observability
    yang lengkap.

------------------------------------------------------------------------

# 3. FUNDAMENTAL RULES

## Rule 1 --- V11.5 adalah frozen baseline

Tidak boleh mengubah V11.5 customer semantics hanya untuk mempermudah
admin.

Dilarang mengubah tanpa phase/domain specification terpisah:

-   measurement model;
-   scoring;
-   result semantics;
-   assessment runtime contract;
-   entitlement semantics;
-   historical result;
-   historical attempt;
-   customer-facing assessment meaning.

## Rule 2 --- Admin controls operational state, not historical reality

Admin boleh mengelola:

-   content future state;
-   workflow state;
-   configuration future state;
-   user access state;
-   operational metadata.

Admin tidak boleh secara diam-diam menulis ulang:

-   completed attempt;
-   historical snapshot;
-   historical question version;
-   historical result;
-   historical report.

## Rule 3 --- Read operations must be cheap and bounded

Tidak boleh membuat halaman admin mengambil seluruh database lalu
melakukan slicing/filtering di browser.

Pattern yang diwajibkan:

``` text
UI
  ↓
API
  ↓
Repository
  ↓
Database
```

Pagination, filtering, sorting, dan search harus diterapkan di
repository/database query.

## Rule 4 --- Every paginated collection requires deterministic ordering

Minimal:

``` text
ORDER BY <business timestamp> DESC, id DESC
```

Tujuannya agar record tidak berpindah antar-page secara nondeterministic
ketika timestamp sama.

## Rule 5 --- High-impact operations retain existing safety controls

Pagination, search, filter, atau bulk selection tidak boleh melemahkan:

-   authorization;
-   server confirmation;
-   readiness;
-   approval;
-   mapping protection;
-   publish protection;
-   archive protection;
-   audit recording.

Bulk operation bukan jalan pintas terhadap governance.

## Rule 6 --- URL is the reproducible state of an admin workspace

Filter, search, sort, page, dan page size harus dapat direpresentasikan
dalam URL jika workspace memang menggunakan state tersebut.

Contoh:

``` text
/admin/question-bank?group=DISC&status=REVIEW_REQUIRED&page=2&pageSize=25
```

Operator harus dapat:

-   refresh;
-   bookmark;
-   copy URL;
-   kembali ke workspace;

tanpa kehilangan state utama.

## Rule 7 --- Server is authoritative

UI tidak boleh menjadi sumber kebenaran untuk:

-   permission;
-   confirmation;
-   lifecycle transition;
-   pagination boundary;
-   filter authorization;
-   entity ownership.

## Rule 8 --- Audit is append-only

Audit event tidak boleh diedit melalui UI.

Audit event tidak boleh dihapus sebagai bagian dari operasi normal.

Jika maintenance/retention policy kelak diperlukan, itu harus menjadi
specification terpisah dan tidak boleh diam-diam ditambahkan ke CRUD
biasa.

## Rule 9 --- No hidden mutation

Workspace yang didefinisikan sebagai read-only tidak boleh:

-   memperbaiki data otomatis;
-   mengubah status;
-   mengubah mapping;
-   mengubah role;
-   mengubah entitlement.

## Rule 10 --- No artificial success

Gate harus menguji behavior nyata.

Tidak boleh:

-   mengganti assertion agar cocok dengan implementasi yang salah;
-   menghapus test hanya karena gagal;
-   memanggil suite legacy yang sudah diarsipkan untuk membuat phase
    baru terlihat lengkap;
-   mengklaim PASS sebelum runtime benar-benar PASS.

------------------------------------------------------------------------

# 4. ARCHITECTURAL PATTERN

## 4.1 Admin Data Workspace

Semua workspace data besar mengikuti pola:

``` text
AdminDataWorkspace
├── Search
├── Filters
├── Sort
├── Page Size
├── Pagination
├── Result Summary
├── Loading State
├── Empty State
├── Error State
└── Row Actions
```

Reusable primitives secara konseptual:

``` text
AdminSearch
AdminFilterBar
AdminSort
AdminPageSizeSelector
AdminPagination
AdminResultSummary
AdminDataTable
```

Implementasi aktual boleh berbeda selama behavior contract sama.

## 4.2 Repository contract

Canonical shape:

``` ts
type PaginationInput = {
  page: number;
  pageSize: number;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};
```

Server harus:

-   normalize `page`;
-   normalize `pageSize`;
-   enforce maximum;
-   calculate total;
-   return deterministic result.

Recommended defaults:

``` text
default pageSize = 25
allowed pageSize = 10, 25, 50, 100
maximum pageSize = 100
```

Nilai final dapat disesuaikan per workspace jika justified, tetapi tidak
boleh unlimited.

------------------------------------------------------------------------

# 5. PHASE MAP

``` text
V11.5
FROZEN BASELINE
   │
   ▼
11.6 Admin Data Workspace Foundation
     + Audit Trail Workspace
     + Pagination
   │
   ▼
11.7 Search & Filter
     + URL State
     + Sorting
   │
   ▼
11.8 Bulk Operations
     + Batch Governance
     + Batch Audit
   │
   ▼
11.9 Global Admin Search
     + Cross-Entity Navigation
   │
   ▼
11.10 Configuration Operations Workspace
      + Readiness / History
   │
   ▼
11.11 Integration Operations
      + Event / Delivery Observability
   │
   ▼
11.12 Admin Hardening
      + Operational Acceptance
      + Performance / Security / Regression
```

------------------------------------------------------------------------

# 6. PHASE 11.6 --- ADMIN DATA WORKSPACE FOUNDATION + AUDIT TRAIL

## 6.1 Objective

Membangun fondasi data navigation reusable dan menjadikannya nyata pada
**Audit Trail Workspace**.

Phase ini menyelesaikan dua masalah utama:

1.  audit sudah ada tetapi belum dapat dijelajahi secara operasional;
2.  list admin belum memiliki pagination yang scalable.

## 6.2 Scope

### A. Reusable pagination foundation

Diterapkan minimal pada:

-   Question Bank;
-   Review;
-   Users;
-   Audit.

### B. Audit Trail Workspace

Route:

``` text
/admin/audit
```

Workspace harus menyediakan:

-   audit event list;
-   pagination;
-   deterministic ordering;
-   event detail;
-   actor;
-   action;
-   entity type;
-   entity ID;
-   from status;
-   to status;
-   timestamp;
-   metadata jika tersedia.

## 6.3 Audit UI

Recommended layout:

``` text
AUDIT TRAIL

Search __________________________

Entity       [All]
Action       [All]
Actor        [All]
Date         [Any]

------------------------------------------------
ACTIVATE
QUESTION_VERSION
Q-001
Admin Name
05 Sep 2026 15:42
------------------------------------------------

APPROVE
QUESTION_VERSION
Q-001
Admin Name
05 Sep 2026 15:40
------------------------------------------------

Showing 1–25 of 247

< Previous   1  2  3  ...   Next >
```

## 6.4 Audit detail

Klik event membuka detail:

``` text
Action
Actor
Entity
Entity ID
Timestamp
From State
To State
Metadata
```

Metadata harus ditampilkan sebagai structured data, bukan hanya raw JSON
blob jika dapat dibuat lebih mudah dibaca.

## 6.5 Audit safety

Audit workspace:

-   read-only;
-   tidak boleh mengubah event;
-   tidak boleh menghapus event;
-   tidak boleh mengubah entity;
-   tidak boleh menjadi indirect mutation path.

## 6.6 Pagination implementation

Repository harus menggunakan database pagination.

Dilarang:

``` text
findMany(all)
→ JavaScript slice()
```

Diperbolehkan:

``` text
count()
findMany({
  skip,
  take,
  orderBy
})
```

atau equivalent query strategy.

## 6.7 Phase 11.6 database policy

Default:

**NO DATABASE MIGRATION**

Karena `AdminContentAuditEvent` sudah ada di V11.5.

Migration hanya boleh muncul jika inspection membuktikan kebutuhan
struktural nyata. Jika migration diperlukan, migration harus additive
dan documented.

## 6.8 Phase 11.6 non-goals

Tidak termasuk:

-   customer UX;
-   scoring;
-   result;
-   assessment engine;
-   entitlement redesign;
-   historical recalculation;
-   global search;
-   bulk mutation;
-   integration redesign.

## 6.9 Phase 11.6 acceptance gate

Minimum:

``` text
PASS:
Admin authorization
Audit workspace loads
Audit event retrieval
Pagination
Page boundary
Deterministic ordering
Empty state
Error state
Audit detail
Read-only safety
Question Bank pagination
Review pagination
Users pagination
No historical mutation
No customer semantics mutation
Typecheck
Production build
```

------------------------------------------------------------------------

# 7. PHASE 11.7 --- SEARCH, FILTER, SORT & URL STATE

## Objective

Membuat admin data benar-benar usable ketika dataset tumbuh.

## Scope

### Question Bank

Search/filter minimum:

-   question code;
-   question text;
-   question group;
-   question status;
-   mapping status.

### Review

Minimum:

-   question code;
-   group;
-   lifecycle state;
-   mapping state;
-   validation state.

### Users

Minimum:

-   name;
-   email;
-   role;
-   status.

### Audit

Minimum:

-   actor;
-   action;
-   entity type;
-   entity ID;
-   date range.

## URL contract

Contoh:

``` text
/admin/users?role=ADMIN&status=ACTIVE&page=2&pageSize=25
```

Refresh harus mempertahankan state.

## Sorting

Sorting hanya pada field yang memang memiliki business meaning.

Default harus deterministic.

## Acceptance

``` text
Search server-side
Filter server-side
Sort server-side
URL persistence
Pagination + filter compatibility
No stale filter state
Clear filters
Empty result state
Authorization preserved
Typecheck
Build
Runtime E2E
```

------------------------------------------------------------------------

# 8. PHASE 11.8 --- BULK OPERATIONS & BATCH GOVERNANCE

## Objective

Mengurangi pekerjaan operator berulang tanpa melemahkan governance.

## Scope

Bulk operations dimulai dari low-risk operations.

Contoh:

``` text
Select 12

[ Validate ]
[ Submit Review ]
```

High-impact operations harus tetap:

``` text
Preview
→ Impact Summary
→ Confirmation
→ Server Authorization
→ Transaction
→ Audit
```

## Batch audit

Setiap affected entity harus dapat ditelusuri.

Batch-level event boleh ditambahkan sebagai parent operation, tetapi
tidak boleh menggantikan entity-level auditability bila individual
traceability dibutuhkan.

## Failure handling

Batch tidak boleh menghasilkan keadaan ambigu.

Harus ditentukan secara eksplisit:

-   all-or-nothing;
-   partial success;
-   retryable failures.

Default untuk lifecycle transitions:

**transactional all-or-nothing jika feasible.**

## Non-goals

Tidak boleh memperkenalkan:

-   silent mass publish;
-   silent mass archive;
-   bypass approval;
-   bypass mapping;
-   bypass readiness.

------------------------------------------------------------------------

# 9. PHASE 11.9 --- GLOBAL ADMIN SEARCH

## Objective

Memungkinkan operator menemukan entity lintas workspace.

Search target minimum:

``` text
Question
Question Version
User
Assessment Configuration
Audit Event
```

Contoh:

``` text
Search: E2E-297
```

hasil:

``` text
Question
Question Version
Audit Events
```

## Rules

Global search:

-   read-only;
-   authorization-aware;
-   tidak boleh membocorkan entity yang tidak boleh dilihat actor;
-   harus menyediakan destination yang jelas;
-   tidak menggantikan workspace-specific filtering.

------------------------------------------------------------------------

# 10. PHASE 11.10 --- CONFIGURATION OPERATIONS WORKSPACE

## Objective

Memperkuat operational handling terhadap Assessment Configuration tanpa
mengubah measurement semantics.

## Scope

-   configuration list;
-   pagination;
-   search;
-   group/type filter;
-   readiness state;
-   active configuration;
-   version history;
-   comparison;
-   activation history;
-   impact preview entry point.

## Safety

Activation tetap mengikuti governance V11.2/V11.3.

Tidak boleh:

-   mengubah historical attempt;
-   recalculation;
-   mengubah scoring version historical;
-   mengubah snapshot historical.

------------------------------------------------------------------------

# 11. PHASE 11.11 --- INTEGRATION OPERATIONS

## Objective

Membuat integration layer observable secara operasional.

## Scope

Jika integration volume sudah membenarkan:

-   integration health;
-   event log;
-   webhook/event status;
-   failed delivery;
-   retry status;
-   timestamp;
-   external reference;
-   reconciliation status.

## Safety

Retry harus idempotent.

Integration observability tidak boleh mengubah customer assessment
semantics.

------------------------------------------------------------------------

# 12. PHASE 11.12 --- ADMIN HARDENING & OPERATIONAL ACCEPTANCE

## Objective

Menjadikan seluruh Admin Operations siap digunakan sebagai operational
system, bukan sekadar kumpulan halaman.

## Scope

### Performance

-   bounded queries;
-   pagination;
-   indexed filters;
-   no unbounded list retrieval;
-   no accidental N+1 query.

### Security

-   admin authorization;
-   entity-level authorization where required;
-   server-side validation;
-   no trust in UI state.

### Reliability

-   consistent loading;
-   empty;
-   error;
-   retry behavior;
-   transaction safety.

### Audit

Setiap material mutation harus auditable.

### Regression

Regression harus mencakup:

``` text
Admin Login
Dashboard
Question Bank
Review
Configuration
Users
Audit
Search
Filter
Pagination
Bulk Operations
Global Search
```

Customer regression hanya diperlukan jika suatu phase menyentuh customer
behavior. Admin-only phase tidak boleh membuat artificial dependency ke
archived legacy suites.

------------------------------------------------------------------------

# 13. CROSS-PHASE DEVELOPMENT KAIDAH

## 13.1 Phase isolation

Satu phase harus memiliki:

-   specification;
-   manifest;
-   delivery notes;
-   validation gate;
-   runtime E2E jika behavior berubah;
-   explicit non-goals.

## 13.2 Baseline discipline

Setiap phase baru dimulai dari ZIP/source baseline yang benar-benar
frozen.

Tidak boleh meneruskan branch/ZIP eksperimen yang sudah dinyatakan
abandoned.

## 13.3 No legacy-suite dependency

Phase baru tidak boleh bergantung pada runtime suite phase lama hanya
karena script tersebut sudah tersedia.

Jika behavior perlu dites, buat regression harness yang sesuai dengan
current architecture.

Legacy artifacts boleh dipakai sebagai reference, bukan sebagai hidden
dependency.

## 13.4 No false-positive gate

Static marker gate hanya membuktikan artifact/contract existence.

Runtime gate harus membuktikan behavior.

Build/typecheck hanya membuktikan compileability.

Ketiganya tidak boleh saling menggantikan.

## 13.5 Cleanup

Semua E2E yang membuat:

-   user;
-   question;
-   question version;
-   configuration;
-   audit event;
-   session;

harus memiliki cleanup yang aman, termasuk `finally`.

Test tidak boleh meninggalkan data operasional yang mencemari test
berikutnya.

------------------------------------------------------------------------

# 14. DATABASE RULES

## 14.1 Prefer existing schema

Sebelum membuat migration:

1.  inspect existing model;
2.  inspect indexes;
3.  inspect repository;
4.  determine whether current schema already supports requirement.

## 14.2 Indexing

Jika Phase 11.7 menambahkan filter yang sering dipakai, index harus
dipertimbangkan berdasarkan query pattern nyata.

Tidak boleh menambahkan index secara spekulatif tanpa query
justification.

## 14.3 Historical records

Tidak ada phase Admin Operations yang boleh meng-update historical
assessment records untuk alasan pagination, search, audit, dashboard,
atau convenience.

------------------------------------------------------------------------

# 15. API CONTRACT RULES

List endpoint harus konsisten.

Recommended:

``` text
GET /api/admin/<resource>?page=1&pageSize=25
```

Response:

``` json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Validation:

-   `page >= 1`;
-   `pageSize >= 1`;
-   `pageSize <= max`;
-   unknown filter rejected or ignored according to endpoint contract;
-   unauthorized request rejected server-side.

Mutation endpoint tidak boleh menerima pagination state sebagai
authority.

------------------------------------------------------------------------

# 16. UX RULES

Admin UI harus:

-   cepat dipindai;
-   tidak terlalu dekoratif;
-   menunjukkan operational state dengan jelas;
-   mempertahankan filter saat navigasi;
-   memberi feedback ketika action berlangsung;
-   memberi error yang actionable;
-   tidak menggunakan destructive action tanpa confirmation;
-   membedakan read-only data dari mutation controls.

## Table/list principle

Untuk data operasional, table/list lebih diutamakan daripada card grid
jika:

-   banyak record;
-   banyak metadata;
-   sorting/filter diperlukan;
-   operator perlu membandingkan row.

------------------------------------------------------------------------

# 17. DASHBOARD PRINCIPLE

Dashboard `/admin` tetap berfungsi sebagai **cockpit**, bukan database
browser.

Dashboard boleh menampilkan:

-   health;
-   warning;
-   recent activity;
-   summary metrics.

Tetapi detail harus diarahkan ke workspace.

Contoh:

``` text
105 Validation Issues
        ↓
Question Bank
status=validation-issue
```

``` text
29 Mapping Issues
        ↓
Review
mapping=issue
```

``` text
Recent Admin Activity
        ↓
/admin/audit
```

------------------------------------------------------------------------

# 18. DEFINITION OF DONE

Sebuah phase dianggap selesai hanya jika:

### Specification

-   scope defined;
-   non-goals defined;
-   safety boundaries defined.

### Implementation

-   repository;
-   API;
-   UI;
-   validation;
-   authorization.

### Verification

-   static gate PASS;
-   typecheck PASS;
-   production build PASS;
-   runtime E2E PASS jika behavior berubah.

### Safety

-   no unauthorized mutation;
-   no historical mutation;
-   no customer semantics mutation unless explicitly scoped;
-   audit behavior verified where applicable.

### Delivery

-   manifest;
-   delivery notes;
-   SHA256;
-   exact baseline recorded.

------------------------------------------------------------------------

# 19. RECOMMENDED DELIVERY ORDER

## 11.6

**Admin Data Workspace Foundation + Audit Trail + Pagination**

Priority: **P0**

## 11.7

**Search + Filter + Sort + URL State**

Priority: **P0**

## 11.8

**Bulk Operations + Batch Governance**

Priority: **P1**

## 11.9

**Global Admin Search + Cross-Entity Navigation**

Priority: **P1/P2**

## 11.10

**Assessment Configuration Operations Workspace**

Priority: **P2**

## 11.11

**Integration Operations & Observability**

Priority: **P2**

## 11.12

**Admin Hardening & Operational Acceptance**

Priority: **P1 after core admin productivity is complete**

------------------------------------------------------------------------

# 20. CURRENT DECISION

**V11.5 remains the frozen production-development baseline.**

The abandoned V11.6 Full Admin + Customer Regression experiment is **not
part of this roadmap**.

The next development target is:

> **Phase 11.6 --- Admin Data Workspace Foundation + Audit Trail
> Workspace + Pagination**

The first implementation should focus on reusable data navigation
primitives and a real `/admin/audit` workspace, then apply pagination to
Question Bank, Review, and Users.

No customer measurement, scoring, result, entitlement, or historical
semantics should be touched by Phase 11.6.

------------------------------------------------------------------------

# 21. PHASE 11.6 INITIAL TASK BREAKDOWN

``` text
11.6.1 Audit repository contract
11.6.2 Pagination repository utility
11.6.3 Audit API
11.6.4 Admin pagination components
11.6.5 /admin/audit page
11.6.6 Question Bank pagination
11.6.7 Review pagination
11.6.8 Users pagination
11.6.9 Audit detail view
11.6.10 Read-only authorization verification
11.6.11 Runtime E2E
11.6.12 Typecheck
11.6.13 Production build
11.6.14 Delivery manifest
11.6.15 Delivery notes
```

**Implementation rule:** Do not proceed to 11.7 until 11.6 has a clean
runtime acceptance.

------------------------------------------------------------------------

# 22. FINAL GOVERNING PRINCIPLE

ReadyScore Admin must evolve from:

``` text
Admin pages that can perform operations
```

into:

``` text
An observable, searchable, auditable,
scalable operational workspace
```

without turning Admin Operations into a mechanism that rewrites customer
reality.

The invariant is:

``` text
ADMIN PRODUCTIVITY ↑
ADMIN OBSERVABILITY ↑
ADMIN GOVERNANCE ↑
DATA SCALE ↑

CUSTOMER MEASUREMENT SEMANTICS = FROZEN
CUSTOMER HISTORICAL REALITY   = FROZEN
```

That is the governing rule for Phase 11.6 and every subsequent Admin
Operations phase.
