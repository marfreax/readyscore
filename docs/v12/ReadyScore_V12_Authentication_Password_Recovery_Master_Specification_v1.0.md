# ReadyScore V12 — Authentication & Password Recovery
## Master Development Specification & Governing Rules
### Version 1.0 — 2026-09-06

---

## 1. STATUS DOKUMEN

**Status:** LOCKED — KAIDAH DEVELOPMENT V12  
**Scope:** Authentication & Password Recovery Hardening sebelum Production Go-Live  
**Phase count:** EXACTLY 5 PHASES  
**Database migration:** Allowed only when explicitly required by the phase contract  
**Measurement/scoring:** OUT OF SCOPE  
**Assessment engine:** OUT OF SCOPE  
**Question Bank:** OUT OF SCOPE  
**Admin feature expansion:** OUT OF SCOPE kecuali yang secara eksplisit diperlukan untuk authentication operations

Dokumen ini adalah **master specification dan kaidah** untuk ReadyScore V12.

Setiap implementasi V12 wajib mengikuti dokumen ini. Developer tidak boleh menambah phase, memperluas scope, atau mengubah invariant V12 tanpa keputusan eksplisit untuk membuka revisi specification.

---

# 2. LATAR BELAKANG

ReadyScore V11.7 telah mencapai baseline operasional untuk Admin Data Workspace, Question Bank Operations, Search, Filter, Sort, URL State, Pagination, Context-Correct Statistics, Import Safety, Duplicate Governance, Four-Group Regression, Runtime E2E, Typecheck, dan Production Build.

Sebelum ReadyScore digunakan pada production, diperlukan satu hardening capability yang bersifat fundamental terhadap lifecycle akun:

- Forgot Password / Password Recovery
- Reset Password
- Change Password
- Security & Abuse Protection
- Authentication Runtime Acceptance

V12 tidak dimaksudkan sebagai pembukaan kembali development authentication secara luas. V12 adalah **security-focused pre-Go-Live hardening phase** dengan scope sempit, eksplisit, dan terukur.

---

# 3. TUJUAN V12

V12 harus menghasilkan authentication credential recovery flow yang:

1. dapat digunakan customer ketika lupa password;
2. tidak mengekspos keberadaan sebuah account melalui response recovery;
3. menggunakan reset token yang cryptographically secure;
4. menyimpan token reset dalam bentuk yang tidak dapat digunakan langsung apabila database terekspos;
5. memiliki expiry dan single-use semantics;
6. tidak mengubah business state ketika password di-reset;
7. tidak memungkinkan admin mengetahui password customer;
8. memiliki abuse protection/rate limiting;
9. memiliki auditability yang cukup untuk operasi;
10. lolos static, typecheck, production build, dan runtime E2E gate sebelum Go Live.

---

# 4. NON-GOALS

V12 TIDAK mencakup:

- redesign authentication architecture secara keseluruhan;
- social login;
- OAuth;
- SSO;
- MFA/2FA;
- passkeys/WebAuthn;
- SMS password recovery;
- WhatsApp password recovery;
- biometric authentication;
- customer self-service account deletion;
- entitlement redesign;
- role redesign;
- UserStatus redesign;
- assessment scoring;
- assessment selection;
- Question Bank;
- payment;
- Scalev integration redesign;
- marketing automation;
- WhatsApp marketing;
- general Admin UX expansion.

Jika capability tersebut diperlukan di masa depan, harus menjadi phase/specification tersendiri.

---

# 5. KAIDAH UTAMA V12

## Rule V12-01 — EXACTLY FIVE PHASES

V12 **HARUS terdiri dari tepat 5 phase**:

1. **V12.1 — Password Recovery Foundation**
2. **V12.2 — Reset Password Flow**
3. **V12.3 — Change Password & Credential Operations**
4. **V12.4 — Security, Abuse Protection & Audit**
5. **V12.5 — Runtime E2E, Production Build & Go-Live Gate**

Tidak boleh ada V12.6.

Jika pekerjaan baru ditemukan setelah V12.5 tetapi berada di luar acceptance contract, pekerjaan tersebut menjadi scope phase/version berikutnya dan tidak boleh disisipkan diam-diam ke V12.

---

# 6. PRINCIPLE: CREDENTIALS ≠ BUSINESS STATE

Password operation hanya boleh memodifikasi credential state yang memang menjadi tanggung jawabnya.

Password reset/change TIDAK BOLEH secara implisit:

- mengaktifkan user;
- menonaktifkan user;
- mengubah role;
- mengubah entitlement;
- mengubah assessment attempt;
- mengubah assessment result;
- mengubah historical customer data;
- membuat assessment baru;
- menghapus historical data.

Khususnya:

> **Reset password bukan mekanisme untuk mengaktifkan kembali account.**

Jika account memiliki `UserStatus.INACTIVE`, reset password tidak boleh mengubahnya menjadi `ACTIVE`.

---

# 7. V12.1 — PASSWORD RECOVERY FOUNDATION

## Tujuan

Membangun foundation untuk password recovery yang aman dan dapat digunakan oleh UI/API.

## Scope

- Forgot Password entry point.
- Password reset request API.
- Secure random reset token generation.
- Token hashing sebelum persistence.
- Expiration.
- Single-use state.
- Recovery request persistence.
- Email delivery abstraction/integration sesuai authentication infrastructure yang tersedia.
- Generic response untuk mencegah account enumeration.
- Server-side validation.
- Rate-limit foundation bila diperlukan untuk endpoint recovery.

## Contract

Input utama:

```text
email
```

Server harus:

1. normalize email sesuai canonical account convention;
2. melakukan lookup account;
3. tidak membocorkan apakah account ada;
4. jika account valid untuk recovery, membuat reset credential artifact;
5. menyimpan hanya representation yang aman untuk token;
6. menetapkan expiry;
7. mengirim reset link melalui email;
8. mengembalikan response generik.

Contoh semantics:

```text
"Jika email tersebut terdaftar, instruksi reset password telah dikirim."
```

Response tidak boleh berbeda secara observable berdasarkan existence account.

## Token Contract

Reset token harus:

- cryptographically random;
- memiliki entropy yang memadai;
- single-use;
- memiliki expiry;
- tidak disimpan plaintext;
- tidak menjadi password baru;
- tidak dapat dipakai setelah successful reset;
- tidak dapat dipakai setelah expiry.

Token yang dikirim ke user boleh berupa opaque token yang hanya dapat diverifikasi terhadap stored representation.

## Reset Link

Reset link harus mengarah ke dedicated reset-password flow.

Password tidak boleh ditempatkan di URL.

Token recovery boleh menjadi credential-recovery artifact pada URL, tetapi harus diperlakukan sebagai secret:

- tidak ditulis ke logs;
- tidak ditampilkan pada audit event;
- tidak disimpan pada analytics payload;
- tidak dipersist sebagai plaintext database field.

---

# 8. V12.2 — RESET PASSWORD FLOW

## Tujuan

Menyelesaikan lifecycle:

```text
Forgot Password
    ↓
Email Reset Link
    ↓
Open Reset Page
    ↓
Validate Token
    ↓
Set New Password
    ↓
Invalidate Token
    ↓
Login
```

## UI

Minimal tersedia:

- `/forgot-password`
- `/reset-password`

UI harus memberikan:

- email input;
- password input;
- password confirmation;
- validation feedback;
- expired/invalid token state;
- success state;
- link kembali ke login.

## Password Validation

Password baru harus melewati policy password yang berlaku pada authentication layer ReadyScore.

Minimal:

- tidak kosong;
- confirmation harus match;
- tidak menerima malformed input;
- tidak disimpan plaintext.

Jika password policy telah memiliki canonical implementation, V12 wajib menggunakan implementation tersebut dan tidak membuat policy kedua yang konflik.

## Reset Transaction

Successful password reset harus atomic terhadap credential mutation dan token invalidation sejauh storage architecture memungkinkan.

Semantics yang diwajibkan:

```text
valid token
    +
valid password
    ↓
password updated
token consumed
```

Jika operasi gagal, system tidak boleh meninggalkan keadaan ambigu yang membuat token dapat digunakan ulang setelah password berhasil berubah.

## Old Password

Setelah reset berhasil:

- old password harus tidak valid;
- new password menjadi credential yang valid;
- token reset menjadi invalid.

---

# 9. V12.3 — CHANGE PASSWORD & CREDENTIAL OPERATIONS

## Tujuan

Memberikan authenticated user kemampuan mengganti password tanpa melalui forgot-password flow.

## Scope

Authenticated endpoint/page:

```text
Change Password
```

Input:

```text
currentPassword
newPassword
confirmNewPassword
```

## Contract

Server wajib:

1. memverifikasi authenticated session;
2. memverifikasi current password;
3. memvalidasi new password;
4. memastikan confirmation match;
5. menyimpan password menggunakan canonical password hashing;
6. tidak mengubah business state.

## Security

Current password harus diverifikasi server-side.

Tidak boleh ada client-only password verification.

Admin tidak boleh melihat plaintext password.

Admin tidak boleh menetapkan plaintext password customer sebagai normal operational workflow.

Jika future product memerlukan admin-assisted recovery:

```text
Admin → Trigger Reset
      ↓
Customer → Receives Reset Link
      ↓
Customer → Sets Password
```

Admin tetap tidak mengetahui password baru.

---

# 10. V12.4 — SECURITY, ABUSE PROTECTION & AUDIT

## Tujuan

Menutup abuse surface dari password recovery.

## 10.1 Account Enumeration Protection

Recovery endpoint tidak boleh memberikan informasi apakah:

- email terdaftar;
- email tidak terdaftar;
- account inactive;
- account active.

Response semantics harus generik.

Perbedaan internal boleh dicatat untuk observability, tetapi tidak boleh bocor ke client.

## 10.2 Rate Limiting

Forgot-password endpoint harus memiliki abuse protection.

Minimum requirement:

- rate limit berdasarkan identifier yang relevan;
- rate limit berdasarkan request origin/IP bila infrastructure memungkinkan;
- repeated requests harus dibatasi;
- system tidak boleh menjadi email-spam primitive.

Exact numeric threshold harus mengikuti environment/infrastructure capacity dan ditetapkan sebagai configuration, bukan hard-coded business behavior yang tersebar.

## 10.3 Token Abuse

System harus menolak:

- expired token;
- invalid token;
- already-consumed token;
- malformed token;
- token yang tidak cocok dengan stored representation.

## 10.4 Audit

Security-relevant event harus dapat diaudit tanpa menyimpan secret.

Minimal event semantics:

```text
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_SUCCEEDED
PASSWORD_RESET_REJECTED
PASSWORD_CHANGED
```

Audit payload tidak boleh menyimpan:

- plaintext password;
- reset token;
- token hash jika tidak diperlukan;
- sensitive authentication secret.

Audit actor semantics harus mengikuti kemampuan identity context yang tersedia.

## 10.5 Logging

Logs tidak boleh mengandung:

- password;
- reset token;
- full reset URL;
- credential secret.

Error message harus cukup untuk debugging tanpa membocorkan authentication secret.

---

# 11. SESSION SEMANTICS

V12 harus secara eksplisit menentukan behavior session setelah password reset/change.

Baseline yang direkomendasikan:

### Password Reset dari Forgot Password

Reset dilakukan melalui recovery flow tanpa authenticated session.

Setelah password berhasil diubah:

- user diarahkan ke login;
- system tidak otomatis menganggap user authenticated hanya karena reset berhasil.

### Change Password Saat Login

Existing authenticated session tetap mengikuti session policy yang berlaku.

Jika authentication infrastructure memiliki session rotation/revocation mechanism, V12 harus menerapkan behavior yang konsisten dan aman.

Tidak boleh membuat session baru secara diam-diam sebagai side effect password reset tanpa contract yang jelas.

---

# 12. USER STATUS SEMANTICS

V12 wajib menghormati `UserStatus`.

## ACTIVE

ACTIVE user dapat melakukan recovery sesuai authentication policy.

## INACTIVE

Reset password tidak boleh mengubah:

```text
INACTIVE → ACTIVE
```

Policy apakah inactive user menerima recovery email harus konsisten dan tidak boleh menyebabkan account enumeration.

Jika system memilih tetap mengirim generic response tanpa melakukan usable reset untuk inactive account, behavior tersebut harus tetap indistinguishable dari sisi client.

---

# 13. DATABASE / DATA MODEL

Database migration diperbolehkan **hanya apabila implementation benar-benar membutuhkan persistent reset-token state**.

Jika diperlukan, data model minimal harus mendukung:

- user/account reference;
- secure token representation;
- expiry;
- consumed/used state atau equivalent;
- created timestamp;
- consumed timestamp bila diperlukan;
- auditability.

Jangan menyimpan plaintext reset token.

Jangan menambahkan field authentication yang tidak dibutuhkan V12.

Migration harus:

- backward-compatible sejauh memungkinkan;
- memiliki deterministic name;
- dapat diverifikasi;
- tidak mengubah historical assessment data.

---

# 14. API CONTRACT

Semua password recovery API harus:

- memiliki server-side validation;
- memiliki authentication/authorization semantics yang eksplisit;
- memiliki generic recovery response;
- tidak mengembalikan password;
- tidak mengembalikan reset token;
- tidak mengembalikan sensitive internal credential state;
- memiliki bounded request body;
- memiliki error contract yang stabil.

Minimal endpoint capabilities:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
```

Actual route naming harus mengikuti existing ReadyScore authentication architecture. Jangan membuat duplicate authentication conventions jika existing routes dapat diperluas secara aman.

---

# 15. EMAIL CONTRACT

Reset email harus:

- dikirim hanya melalui configured email provider;
- menggunakan HTTPS reset URL di production;
- memiliki expiry information yang jelas;
- tidak menyertakan password;
- tidak menyertakan sensitive account information yang tidak diperlukan;
- memiliki clear call-to-action;
- menyediakan fallback bila token expired/invalid melalui request reset baru.

Development/test environment boleh menggunakan deterministic email capture/logging mechanism, tetapi production tidak boleh mengandalkan development transport.

---

# 16. UI / UX PRINCIPLES

UI password recovery harus sederhana.

## Forgot Password

```text
Email
[ Kirim Link Reset Password ]

← Kembali ke Login
```

Setelah submit:

```text
Jika email tersebut terdaftar,
instruksi reset password telah dikirim.
```

Jangan mengatakan:

```text
Email tidak ditemukan.
```

## Reset Password

```text
Password Baru
Konfirmasi Password Baru

[ Reset Password ]
```

Expired/invalid:

```text
Link reset password sudah tidak valid.
Silakan minta link reset password baru.
```

Jangan menampilkan token mentah.

---

# 17. SECURITY INVARIANTS

Semua implementation V12 harus menjaga invariant berikut.

### INV-01
Password tidak pernah disimpan plaintext.

### INV-02
Reset token tidak pernah disimpan plaintext.

### INV-03
Reset token memiliki expiry.

### INV-04
Reset token hanya dapat digunakan sekali.

### INV-05
Expired token selalu ditolak.

### INV-06
Consumed token selalu ditolak.

### INV-07
Forgot-password response tidak melakukan account enumeration.

### INV-08
Password reset tidak mengubah UserStatus.

### INV-09
Password reset tidak mengubah role.

### INV-10
Password reset tidak mengubah entitlement.

### INV-11
Password reset tidak mengubah assessment history.

### INV-12
Admin tidak dapat membaca password user.

### INV-13
Admin tidak dapat membaca reset token.

### INV-14
Authentication secret tidak masuk application logs.

### INV-15
Password change memerlukan authenticated session dan current password verification.

### INV-16
Semua credential mutation dilakukan server-side.

### INV-17
Credential operation tidak mengubah measurement/scoring state.

---

# 18. V12.5 — RUNTIME E2E, PRODUCTION BUILD & GO-LIVE GATE

## Tujuan

Membuktikan bahwa seluruh V12 behavior bekerja melalui runtime nyata, bukan hanya static inspection.

## Required Static Gates

Wajib:

```bash
pnpm v12:gate
pnpm typecheck
pnpm build
```

Jika phase memiliki gate spesifik, gate tersebut harus tetap dijalankan sesuai phase contract.

## Runtime E2E

Minimal harus membuktikan:

### Recovery Happy Path

```text
request reset
→ reset email artifact available
→ valid token
→ set new password
→ old password rejected
→ new password accepted
```

### Token Safety

```text
valid token → PASS
expired token → REJECT
invalid token → REJECT
consumed token → REJECT
token reuse → REJECT
```

### Enumeration

```text
existing email
non-existing email
inactive account
```

harus memiliki externally equivalent recovery response.

### Change Password

```text
authenticated
→ current password valid
→ new password valid
→ password changed
→ new password accepted
```

dan:

```text
wrong current password
→ rejected
```

### Business-State Protection

E2E harus membuktikan bahwa reset/change password tidak mengubah:

- UserStatus;
- role;
- entitlement;
- assessment attempt;
- assessment result.

### Abuse Protection

E2E harus membuktikan repeated recovery requests eventually receive rate-limit protection sesuai configured threshold.

---

# 19. FIVE-PHASE DEVELOPMENT ORDER

## V12.1
**Password Recovery Foundation**

Deliver:

- recovery persistence;
- secure token;
- hashing;
- expiry;
- request API;
- email abstraction;
- generic response.

Gate:

- static contract;
- typecheck.

---

## V12.2
**Reset Password Flow**

Deliver:

- reset page;
- token validation;
- password update;
- token consumption;
- login continuation.

Gate:

- static contract;
- typecheck;
- targeted runtime.

---

## V12.3
**Change Password & Credential Operations**

Deliver:

- authenticated change-password UI/API;
- current-password verification;
- canonical hashing;
- credential operation semantics.

Gate:

- static contract;
- typecheck;
- targeted runtime.

---

## V12.4
**Security, Abuse Protection & Audit**

Deliver:

- enumeration protection;
- rate limiting;
- token abuse protection;
- audit events;
- secret-safe logging;
- session semantics;
- UserStatus protection.

Gate:

- static security contract;
- typecheck;
- targeted runtime.

---

## V12.5
**Runtime E2E, Production Build & Go-Live Gate**

Deliver:

- complete V12 runtime E2E;
- regression;
- typecheck;
- production build;
- delivery manifest;
- final closure evidence.

Gate:

```text
V12 static gate PASS
Typecheck PASS
Production Build PASS
Runtime E2E PASS
Security invariants PASS
No unauthorized scope expansion
```

Only after all are PASS may V12 be declared:

**CLOSED / FROZEN / GO-LIVE READY**

---

# 20. REGRESSION REQUIREMENT

V12 adalah authentication hardening, tetapi perubahan credential layer tidak boleh merusak:

- existing login;
- admin login;
- public assessment flow;
- RIASEC;
- DISC;
- EQ;
- Cognitive;
- result experience;
- Question Bank;
- Admin Review;
- Admin Users;
- Admin Audit;
- existing entitlement/access behavior.

Minimal smoke regression harus dilakukan setelah credential mutation implementation.

---

# 21. PRODUCTION DEPLOYMENT RULE

V12 tidak otomatis berarti production deployment.

Setelah V12 PASS:

1. gunakan artifact V12 yang sudah diverifikasi;
2. jalankan production environment migration jika ada;
3. verifikasi environment variables;
4. verifikasi email provider;
5. verifikasi HTTPS/domain;
6. lakukan authentication smoke test;
7. lakukan satu end-to-end recovery test di production dengan test account;
8. verifikasi backup/rollback;
9. baru lakukan Go-Live.

Tidak boleh mengembangkan feature baru di tengah Go-Live deployment.

---

# 22. ARTIFACT & VERSIONING RULE

Setiap phase V12 harus menghasilkan artifact yang dapat ditelusuri.

Minimal:

```text
V12.x ZIP
SHA256
Architecture / Specification evidence
Delivery Notes
Manifest
Gate script
```

Artifact final harus berasal dari artifact phase sebelumnya yang telah PASS.

Jangan membangun phase berikutnya dari branch/artifact yang belum terbukti PASS.

---

# 23. NO SILENT SCOPE EXPANSION

Selama V12:

DILARANG memasukkan secara diam-diam:

- MFA;
- WhatsApp OTP;
- SMS OTP;
- OAuth;
- SSO;
- passkeys;
- account deletion;
- profile redesign;
- entitlement redesign;
- admin redesign;
- marketing automation;
- unrelated UI cleanup;
- unrelated refactor.

Jika ditemukan dependency yang memang diperlukan untuk V12, dependency tersebut harus dijelaskan dalam delivery notes dan tetap berada dalam scope authentication recovery yang ditentukan dokumen ini.

---

# 24. DEFINITION OF DONE

V12 hanya dianggap selesai apabila:

- tepat 5 phase telah diselesaikan;
- Forgot Password bekerja;
- Reset Password bekerja;
- Change Password bekerja;
- reset token aman;
- token expiry bekerja;
- token single-use bekerja;
- account enumeration terlindungi;
- rate limiting bekerja;
- audit event tersedia;
- secret tidak masuk logs;
- UserStatus tidak berubah akibat reset;
- role/entitlement tidak berubah;
- historical assessment state tidak berubah;
- existing login tetap bekerja;
- four assessment types tetap bekerja;
- static gate PASS;
- typecheck PASS;
- production build PASS;
- runtime E2E PASS;
- final artifact integrity PASS;
- delivery manifest lengkap.

---

# 25. CLOSURE RULE

V12 boleh dinyatakan:

> **V12 CLOSED / FROZEN**

hanya jika seluruh acceptance evidence tersedia.

Status berikut tidak cukup:

- "code sudah selesai";
- "typecheck PASS";
- "build PASS";
- "UI terlihat benar".

V12 membutuhkan **behavioral proof** untuk credential recovery dan security invariants.

Setelah V12 CLOSED/FROZEN, perubahan terhadap password recovery harus diperlakukan sebagai perubahan terkontrol dan tidak boleh dilakukan sebagai hotfix informal kecuali untuk security incident yang terdokumentasi.

---

# 26. MASTER ACCEPTANCE MATRIX

| Area | Required |
|---|---:|
| Forgot Password | PASS |
| Secure Token | PASS |
| Token Hashing | PASS |
| Token Expiry | PASS |
| Single Use | PASS |
| Reset Password | PASS |
| Old Password Rejection | PASS |
| Change Password | PASS |
| Current Password Verification | PASS |
| Account Enumeration Protection | PASS |
| Rate Limiting | PASS |
| Audit | PASS |
| Secret-safe Logging | PASS |
| UserStatus Protection | PASS |
| Role Protection | PASS |
| Entitlement Protection | PASS |
| Assessment History Protection | PASS |
| Existing Login Regression | PASS |
| Four Assessment Regression | PASS |
| Static Gate | PASS |
| Typecheck | PASS |
| Production Build | PASS |
| Runtime E2E | PASS |
| Artifact Integrity | PASS |
| Delivery Manifest | PASS |

---

# 27. FINAL GOVERNING STATEMENT

**ReadyScore V12 adalah security-focused pre-Go-Live authentication hardening.**

V12 memiliki **tepat lima phase dan tidak lebih**.

Urutan resmi:

```text
V12.1 Password Recovery Foundation
        ↓
V12.2 Reset Password Flow
        ↓
V12.3 Change Password & Credential Operations
        ↓
V12.4 Security, Abuse Protection & Audit
        ↓
V12.5 Runtime E2E, Production Build & Go-Live Gate
        ↓
V12 CLOSED / FROZEN
        ↓
PRODUCTION GO-LIVE
```

Prinsip tertinggi V12:

> **Credential recovery must be secure, server-enforced, auditable, single-use, abuse-resistant, and completely isolated from ReadyScore business state.**

Dokumen ini menjadi **kaidah utama development V12**.
