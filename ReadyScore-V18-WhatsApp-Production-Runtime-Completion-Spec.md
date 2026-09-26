# ReadyScore — V18 WhatsApp Production Runtime Completion
## Architecture, Specification, Kaidah, Phase Plan, dan Definition of Done

**Status:** Development Baseline / Architecture Lock  
**Project:** ReadyScore  
**Previous completed baseline:** V17.11 — Question Architecture Freeze & Full Regression — PASS  
**Primary focus:** WhatsApp Production Runtime Completion  
**Next major product after V18:** V19 — AI Career Advisor

---

# 1. Purpose

Dokumen ini menjadi acuan resmi pengembangan ReadyScore setelah V17.11.

V17.11 telah menyelesaikan Question Architecture Freeze dan full regression. V18 tidak boleh membuka kembali architecture Question/Assessment yang sudah frozen.

Fokus V18 adalah menyelesaikan dan mensertifikasi **WhatsApp operational layer** di dalam ReadyScore menggunakan Meta WhatsApp Cloud API.

Prinsip utama:

> **Own the conversation, not the WhatsApp infrastructure.**

Meta tetap menjadi infrastruktur WhatsApp. ReadyScore memiliki conversation data, customer context, inbox, operational workflow, dan admin experience.

---

# 2. Current Baseline

V17.11:

- Question Architecture Freeze: PASS
- Typecheck: PASS
- Production build: PASS
- Read-safe runtime regression: PASS
- V17.10 runtime alignment: PASS
- V17.10.1 Admin UI gate: PASS
- Paid customer actual runtime E2E: PASS
- Identity / entitlement delivery: PASS

Question Architecture dianggap frozen.

Canonical chain yang tidak boleh diubah tanpa alasan arsitektural yang sangat kuat:

```text
AssessmentConfigurationVersion
        ↓
QuestionPackageVersion
        ↓
Composition Rules
        ↓
QuestionVersion
        ↓
AssessmentAttempt Snapshot
        ↓
Scoring
        ↓
Result / Report
```

WhatsApp hanya mengonsumsi context/result yang sudah tersedia.

---

# 3. V18 Product Principle

## Conversation First

Inbox adalah operational center untuk customer communication.

Admin harus dapat menjawab:

1. Siapa customer ini?
2. Apa yang customer katakan?
3. Apa yang ReadyScore sebelumnya kirim?
4. Assessment context apa yang tersedia?
5. Business Lead mana yang terkait?
6. Apakah admin dapat membalas sekarang?
7. Apa aktivitas terakhir?

Tujuan utama adalah meminimalkan context switching.

---

# 4. V18 Scope

## In Scope

### WhatsApp Webhook

- Meta webhook verification
- inbound message receiving
- provider event validation
- signature validation
- message normalization
- duplicate event protection
- message persistence
- delivery/status event handling
- safe error handling

### Conversation

- automatic conversation creation
- conversation reuse
- conversation list
- latest message
- unread count
- read state
- last activity
- customer phone number
- customer display name when available

### Message

Minimum operational types:

```text
TEXT inbound
TEXT outbound
DOCUMENT outbound
DELIVERY STATUS
READ STATUS
FAILED STATUS
```

Media inbound boleh disiapkan agar extensible, tetapi bukan requirement awal.

### Admin Inbox

- conversation sidebar
- message timeline
- composer
- unread/read state
- latest message
- customer information
- Business Lead context
- assessment context
- delivery state

### Outbound Reply

Admin dapat mengirim text reply melalui Meta WhatsApp Cloud API.

### Business Lead Integration

Conversation dapat dihubungkan dengan Business Lead existing.

### Customer Context

Jika tersedia:

- name
- WhatsApp number
- email
- source
- assessment attempt
- RIASEC result
- Free Report status
- Business Lead
- last interaction

Tidak boleh membuat second CRM identity system.

---

# 5. Explicitly Out of Scope

Tidak termasuk V18:

- AI chatbot
- AI Career Advisor
- automated AI replies
- lead scoring
- campaign management
- broadcast management
- bulk messaging
- marketing automation
- WhatsApp group management
- WhatsApp Web automation
- QR-based unofficial API
- third-party WhatsApp provider dependency
- full CRM
- sales pipeline redesign
- ticketing system
- omnichannel inbox
- Instagram inbox
- Messenger inbox
- email inbox
- advanced analytics
- chatbot builder
- template management UI
- multi-business WhatsApp tenancy

Scope tersebut dapat menjadi future versions.

---

# 6. WhatsApp Provider

Provider resmi:

```text
Meta WhatsApp Cloud API
```

Production identity existing tetap menjadi source of truth.

```text
Meta App:
WAReadyScore

WhatsApp Business Account ID:
1394892188831173

Phone Number ID:
1341235719073518

Phone:
+62 811-9696-2200

Graph API:
v23.0
```

Secrets:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=
```

Secret rules:

- server-side only
- never returned to browser
- never logged
- never stored in database
- never committed
- never included in API response
- never included in screenshots/test output

Tidak boleh menggunakan:

- QR automation
- WhatsApp Web scraping
- unofficial WhatsApp libraries
- device emulation
- third-party inbox provider sebagai dependency arsitektur

---

# 7. Target Architecture

```text
Customer WhatsApp
        ↓
Meta WhatsApp Cloud API
        ↓
Webhook
        ↓
ReadyScore API
        ↓
Conversation / Message DB
        ↓
ReadyScore Admin Inbox
        ↓
Admin Reply
        ↓
Meta Graph API
        ↓
Customer
```

Customer context:

```text
Conversation
      ↓
BusinessLead
      ↓
Assessment / Result
      ↓
Free Report / Delivery
```

Tidak boleh membuat identity system kedua.

---

# 8. Backend Bounded Context

WhatsApp harus menjadi bounded context terpisah tanpa merusak domain existing.

Struktur konseptual:

```text
whatsapp/
├── whatsapp.module
├── whatsapp.controller
├── whatsapp.service
├── webhook/
│   ├── webhook.controller
│   ├── webhook.service
│   └── signature.service
├── conversation/
│   ├── conversation.service
│   └── conversation.repository
├── message/
│   ├── message.service
│   └── message.repository
├── provider/
│   ├── whatsapp-cloud-api.client
│   └── whatsapp-cloud-api.types
├── dto/
└── types/
```

Exact placement harus mengikuti architecture source V17.11 apabila equivalent module sudah tersedia.

Jangan membuat backend framework kedua.

---

# 9. Frontend Architecture

Canonical route:

```text
/admin/whatsapp
```

Preferred desktop layout:

```text
+----------------+------------------------+-------------------+
| Conversations  | Message Timeline       | Customer Context  |
|                |                        |                   |
| Search         | Customer               | Name              |
| Unread         | messages               | WhatsApp          |
|                |                        | Email             |
| Customer A     |                        | Business Lead     |
| Customer B     |                        | Assessment        |
| Customer C     |                        | Free Report       |
|                |                        | Delivery          |
+----------------+------------------------+-------------------+
```

Responsive:

- desktop: three columns
- tablet: two columns
- mobile: stacked navigation

Gunakan existing ReadyScore design system. Jangan membuat UI framework baru.

---

# 10. Database Model

## WhatsAppConversation

Minimum:

```text
id
businessLeadId nullable
phoneNumber
displayName nullable
status
unreadCount
lastMessageAt nullable
lastInboundAt nullable
lastOutboundAt nullable
createdAt
updatedAt
```

Status:

```text
OPEN
CLOSED
```

Jangan overbuild conversation state.

## WhatsAppMessage

Minimum:

```text
id
conversationId
direction
messageType
externalMessageId nullable/unique
text nullable
mediaId nullable
mediaMimeType nullable
mediaFilename nullable
status
providerErrorCode nullable
providerErrorMessage nullable
metadata JSON nullable
sentAt nullable
deliveredAt nullable
readAt nullable
createdAt
updatedAt
```

Direction:

```text
INBOUND
OUTBOUND
```

Message type:

```text
TEXT
DOCUMENT
IMAGE
VIDEO
AUDIO
UNKNOWN
```

Initial operational implementation hanya wajib TEXT dan DOCUMENT sesuai scope.

---

# 11. Conversation Identity

Primary WhatsApp identity:

```text
phoneNumber
```

Normalization wajib.

Contoh:

```text
+62 811-9696-2200
6281196962200
0811-9696-2200
```

harus menghasilkan canonical representation yang sama.

Reuse existing normalization utility jika tersedia.

Conversation uniqueness harus deterministic dan channel-aware.

Recommended conceptual identity:

```text
phoneNumber + channel
```

dengan:

```text
channel = WHATSAPP
```

---

# 12. Idempotency

Idempotency adalah mandatory.

Meta dapat mengirim webhook event lebih dari sekali.

Flow:

```text
Webhook Event
      ↓
Provider Message ID
      ↓
Already exists?
   ┌───────┴───────┐
  YES             NO
   ↓               ↓
 ignore          persist
```

Rules:

- `externalMessageId` harus unique jika provider menyediakan ID
- duplicate inbound webhook tidak boleh membuat duplicate message
- duplicate outbound operation tidak boleh menghasilkan unintended duplicate message
- webhook retries harus aman

---

# 13. Webhook Security

Endpoint:

```text
GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

GET verification:

```text
hub.mode
hub.verify_token
hub.challenge
```

POST signature:

```text
X-Hub-Signature-256
```

Signature menggunakan server-side app secret.

Webhook harus:

- validate
- parse
- acknowledge quickly
- process safely
- persist message
- update conversation
- process delivery/read status

Jangan melakukan operasi mahal dalam synchronous webhook request.

---

# 14. Conversation Processing

Inbound:

```text
Meta Webhook
    ↓
Verify Signature
    ↓
Parse Event
    ↓
Identify Event Type
    ↓
Idempotency Check
    ↓
Find/Create Conversation
    ↓
Find Business Lead
    ↓
Persist Message
    ↓
Update Unread
    ↓
Complete
```

Harus resilient terhadap:

- duplicate events
- missing optional fields
- unknown message types
- unknown status types
- malformed payloads
- provider retries
- temporary DB errors

Unknown event harus aman di-ignore dan dicatat tanpa secret.

---

# 15. Business Lead Integration

Existing `BusinessLead` tetap menjadi identity system utama.

Matching priority:

1. normalized WhatsApp number
2. normalized email jika tersedia
3. explicit admin link

Jangan melakukan identity guessing berdasarkan nama saja.

Conversation tetap valid walaupun belum memiliki Business Lead.

---

# 16. Admin Authorization

Inbox adalah operational private data.

Minimum:

```text
Authenticated Admin
```

Unauthorized:

```text
401 Unauthorized
```

Authenticated tetapi tidak punya privilege:

```text
403 Forbidden
```

Reuse existing ReadyScore authentication dan RBAC.

Jangan membuat authorization system kedua.

Authorized actions:

- view conversations
- view messages
- send messages
- mark read
- link Business Lead

---

# 17. Admin Inbox Behavior

Conversation list menampilkan:

```text
Customer name
Last message preview
Last activity time
Unread count
```

Sorting:

```text
lastMessageAt DESC
```

Default:

```text
OPEN conversations
```

Search:

- name
- phone number

Message timeline menampilkan:

```text
message
timestamp
direction
status
```

Provider-confirmed status:

```text
SENDING
SENT
DELIVERED
READ
FAILED
```

UI tidak boleh mengklaim DELIVERED atau READ sebelum provider event benar-benar diterima.

---

# 18. Reply Composer

Initial composer:

```text
textarea
Send
```

Rules:

- Enter = send
- Shift+Enter = newline
- disabled while sending
- clear after confirmed send
- show failure state
- retry hanya jika aman

Initial admin composer: text only.

Jangan membuat unsafe "send anything anytime".

Jika Meta menolak karena template diperlukan:

```text
FAILED
```

dan UI menampilkan operational error yang berguna.

Jangan fake success.

---

# 19. Outbound Provider Architecture

Gunakan satu provider client:

```text
WhatsAppCloudApiClient
```

Responsibilities:

- build Graph API request
- attach authorization
- send message
- parse response
- return provider message ID
- map provider errors
- never expose access token

Jangan duplicate Meta API logic di banyak controller.

---

# 20. Delivery Status

Expected lifecycle:

```text
SENDING
   ↓
SENT
   ↓
DELIVERED
   ↓
READ
```

Failure:

```text
SENDING
   ↓
FAILED
```

Database harus menyimpan latest known provider status.

---

# 21. Customer Context

Context panel hanya boleh menggunakan existing ReadyScore information.

Customer:

```text
Name
WhatsApp
Email
```

Business Lead:

```text
Lead status
Source
Created at
```

Assessment:

```text
Assessment attempt
RIASEC result
```

Free Report:

```text
Generated
Downloaded
WhatsApp delivery
Email delivery
```

Jangan membuat customer profile/CRM system baru.

---

# 22. Auditability

Jika existing audit infrastructure mendukung, catat minimal:

```text
admin sent WhatsApp message
admin linked conversation
admin marked conversation read
```

Audit data:

```text
actor
action
target
timestamp
```

Never store secrets in audit records.

---

# 23. Logging Rules

Allowed:

```text
conversationId
messageId
providerMessageId
event type
status
provider error code
```

Forbidden:

```text
access token
app secret
verify token
full webhook signature
password
session cookie
```

Phone number sebaiknya dimasking pada operational logs jika memungkinkan.

---

# 24. Error Handling

Provider/application errors harus dipetakan ke safe application errors.

Examples:

```text
WHATSAPP_PROVIDER_NOT_CONFIGURED
WHATSAPP_AUTH_FAILED
WHATSAPP_PHONE_NOT_FOUND
WHATSAPP_RATE_LIMITED
WHATSAPP_TEMPLATE_REQUIRED
WHATSAPP_PROVIDER_REJECTED
WHATSAPP_NETWORK_ERROR
WHATSAPP_UNKNOWN_ERROR
```

Raw secrets tidak boleh muncul pada UI atau logs.

---

# 25. Performance

Webhook:

- acknowledge quickly
- no expensive rendering
- no PDF generation
- no unnecessary external API chain

Inbox:

- paginated conversations
- paginated messages
- never load entire history
- lazy-load older messages

Initial target:

```text
Conversation list: 50
Message page: 50
```

---

# 26. Data Retention

V18 tidak melakukan automatic deletion.

Initial policy:

```text
No automatic deletion
```

Retention policy dapat dibuat pada future version.

---

# 27. API Surface

Conceptual endpoints:

```text
GET  /api/admin/whatsapp/conversations
GET  /api/admin/whatsapp/conversations/:id
GET  /api/admin/whatsapp/conversations/:id/messages

POST /api/admin/whatsapp/conversations/:id/messages
POST /api/admin/whatsapp/conversations/:id/read
POST /api/admin/whatsapp/conversations/:id/link-lead

GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

Final naming harus mengikuti existing ReadyScore API conventions.

Gunakan existing API response contract.

Typical:

```json
{
  "ok": true,
  "data": {}
}
```

Jangan membuat response envelope kedua.

---

# 28. V18 Phase Plan

V18 menggunakan **4 phase utama**. Tidak dipecah menjadi phase kecil kecuali dependency teknis benar-benar mengharuskan.

## V18.0 — Architecture & Baseline Reconciliation

### Objective

Mencocokkan source V17.11 terakhir dengan WhatsApp architecture baseline dan mengunci gap yang benar-benar perlu dikerjakan.

### Scope

- audit existing WhatsApp source
- map existing vs target architecture
- database model review
- API contract review
- webhook contract review
- security boundary review
- identify missing functionality
- preserve existing working WhatsApp implementation
- define migration strategy jika diperlukan
- lock phase gates

### Output

```text
V18 Gap Matrix
V18 Architecture Contract
V18 API Contract
V18 Security Contract
V18 Implementation Scope
```

### Gate

```text
V18.0 PASS
```

Acceptance:

- tidak ada ambiguity architecture
- existing functionality teridentifikasi
- gap teridentifikasi
- tidak ada unnecessary rewrite
- Question Architecture tetap frozen
- no production change

---

# 29. V18.1 — WhatsApp Core Runtime

### Objective

Menyelesaikan backend WhatsApp runtime secara production-safe.

### Scope

- webhook verification
- POST webhook
- signature validation
- event normalization
- inbound persistence
- phone normalization
- conversation creation/reuse
- message persistence
- idempotency
- delivery/read status
- Meta Graph API client
- outbound message persistence
- provider error mapping
- safe acknowledgement

### Gate

```text
V18.1 CORE RUNTIME — PASS
```

Acceptance:

- webhook verification PASS
- signature validation PASS
- inbound message PASS
- duplicate webhook PASS
- conversation reuse PASS
- message persistence PASS
- outbound provider integration PASS
- provider status update PASS
- no secret exposure
- typecheck PASS
- build PASS

---

# 30. V18.2 — Admin Inbox & Customer Context

### Objective

Menyelesaikan operational inbox untuk admin.

### Scope

- `/admin/whatsapp`
- conversation list
- search
- unread state
- read state
- message timeline
- pagination
- composer
- send text
- provider status
- BusinessLead context
- assessment context
- Free Report context
- explicit lead linking
- admin authorization
- audit actions

### Gate

```text
V18.2 ADMIN INBOX — PASS
```

Acceptance:

- authorized admin access PASS
- unauthorized access blocked
- conversations load
- messages load
- unread/read work
- send text PASS
- failure handling PASS
- BusinessLead linking PASS
- customer context accurate
- no duplicate identity system

---

# 31. V18.3 — Production Hardening & Full Certification

### Objective

Memastikan WhatsApp layer production-safe tanpa merusak ReadyScore existing.

### Scope

Security:

- rate limit
- webhook retry safety
- idempotency hardening
- audit
- secret/logging review
- security headers
- input validation
- output sanitization

Performance:

- pagination
- message loading
- conversation loading
- webhook latency

Regression:

- existing ReadyScore assessment
- scoring
- result
- report
- lead
- payment
- entitlement
- existing WhatsApp outbound
- email delivery
- commercial flow
- Question Architecture

Local E2E:

```text
Meta-like webhook
      ↓
ReadyScore
      ↓
Conversation
      ↓
Message
      ↓
Admin Inbox
      ↓
Admin Reply
      ↓
Provider-like response
      ↓
Status Update
```

Production:

```text
Meta → ReadyScore Webhook
ReadyScore → Meta
Real inbound WhatsApp
Real admin reply
Real outbound WhatsApp
Real delivery/read status
```

### Gate

```text
V18.3 PRODUCTION CERTIFICATION — PASS
```

Kemudian:

```text
V18 — WhatsApp Production Runtime Completion — PASS
```

---

# 32. Phase Completion Policy

Setiap phase wajib mengikuti:

```text
Implementation
      ↓
Static Gate
      ↓
Typecheck
      ↓
Build
      ↓
Runtime Test
      ↓
Regression
      ↓
PASS
```

Code exists bukan berarti phase PASS.

Jika dependency eksternal belum tersedia:

```text
SKIPPED
```

bukan PASS.

---

# 33. V18 Definition of Done

V18 hanya PASS jika seluruh berikut terpenuhi.

## Webhook

- Meta verification works
- inbound event reaches ReadyScore
- signature validation works
- duplicate webhook does not duplicate message

## Conversation

- new customer creates conversation
- existing customer reuses conversation
- phone normalization works
- unread count works
- history persists

## Inbox

- authorized admin accesses `/admin/whatsapp`
- conversations load
- messages load
- unread/read works
- context loads

## Reply

- admin can send text
- message persists
- provider message ID persists
- provider status reflected
- failures shown correctly

## Business Lead

- existing Business Lead matching works
- explicit linking works
- no duplicate identity system

## Security

- unauthorized inbox blocked
- unauthorized send blocked
- webhook verification works
- access token never exposed
- app secret never exposed
- secrets never logged

## Regression

Preserve:

- Free Assessment
- Free Lead Capture
- Business Lead
- Free Report
- PDF
- WhatsApp outbound
- Email
- Premium
- Checkout
- Entitlement
- Question Architecture
- Scoring
- Result
- Report

## Production

- typecheck PASS
- build PASS
- existing regression PASS
- V18 static gates PASS
- local webhook E2E PASS
- local inbox E2E PASS
- production smoke PASS
- production real inbound WhatsApp PASS
- production real admin reply PASS
- production outbound WhatsApp PASS
- provider status verification PASS

---

# 34. What Must NOT Be Changed

V18 tidak boleh merombak:

- Question Architecture V17.11
- QuestionVersion identity
- AssessmentConfiguration architecture
- QuestionPackage architecture
- AssessmentAttempt historical snapshot
- scoring engine
- result engine
- report engine
- BusinessLead identity architecture
- authentication architecture
- entitlement architecture
- payment architecture
- Free Report architecture
- existing delivery architecture

Perubahan harus additive dan backward-compatible.

Historical data tidak boleh dihapus untuk membuat test PASS.

---

# 35. Development Style

Rules:

1. execution-focused
2. jangan muter-muter
3. jangan mengulang hal yang sudah jelas
4. jangan redesign architecture yang sudah PASS
5. local first
6. production hanya setelah local PASS
7. setiap perubahan harus memiliki verification command
8. jangan claim PASS sebelum actual validation
9. root cause analysis sebelum patch
10. jangan melemahkan assertion hanya untuk membuat test hijau
11. jangan menghapus historical data
12. jangan mengubah database tanpa migration yang jelas
13. jangan mengubah production selama development phase
14. jika error ditemukan setelah ZIP diberikan, source harus diperbaiki dan **full ZIP dibuild ulang**
15. user tidak perlu melakukan manual file editing
16. setiap replacement build harus berdasarkan baseline ZIP terakhir yang PASS

---

# 36. Full ZIP Policy

Setiap development delivery harus berupa:

```text
FULL ZIP
```

berdasarkan baseline terakhir yang sudah PASS.

Jika ditemukan error:

```text
User Test
    ↓
Error
    ↓
Root Cause Analysis
    ↓
Source Patch
    ↓
Local Verification
    ↓
FULL ZIP REBUILD
    ↓
User Test
```

Tidak meminta user melakukan manual edit terhadap source file.

---

# 37. Database Safety

Selama development:

- jangan delete historical WhatsApp data
- jangan delete historical ReadyScore data
- jangan mutate historical assessment attempts
- migration harus additive bila memungkinkan
- tidak menggunakan data deletion untuk membuat test PASS
- production DB tidak disentuh sebelum production phase

---

# 38. Production Policy

Production deployment hanya boleh dilakukan setelah:

```text
V18.0 PASS
V18.1 PASS
V18.2 PASS
V18.3 local certification PASS
```

Kemudian production sequence:

```text
deployment
↓
migration if required
↓
Prisma generate if required
↓
build
↓
restart
↓
smoke test
↓
Meta webhook verification
↓
real inbound WhatsApp
↓
admin reply
↓
real outbound WhatsApp
↓
status verification
```

Production PASS berarti actual runtime evidence tersedia.

---

# 39. Roadmap After V18

```text
V17.11
Question Architecture Freeze
        ↓
        PASS
        ↓
V18
WhatsApp Production Runtime Completion
        ↓
        PASS
        ↓
V19
AI Career Advisor
```

AI Career Advisor tidak dimulai sebagai bagian dari V18.

Question Architecture V17.11 harus tetap menjadi source of truth untuk AI pada V19.

---

# 40. Final Architecture Principle

ReadyScore memiliki dua operational foundations:

```text
ASSESSMENT DOMAIN
QuestionVersion
      ↓
QuestionPackageVersion
      ↓
AssessmentConfigurationVersion
      ↓
AssessmentAttempt
      ↓
Result / Report


CONVERSATION DOMAIN
Meta WhatsApp Cloud API
      ↓
Webhook
      ↓
Conversation
      ↓
Message
      ↓
BusinessLead / Assessment Context
      ↓
Admin Inbox
      ↓
Outbound Reply
```

Kedua domain dapat terhubung melalui existing customer/BusinessLead context tanpa membuat duplicate identity system.

---

# 41. Final Commandment

> **Do not rebuild WhatsApp. Build the ReadyScore operational conversation layer on top of Meta WhatsApp Cloud API.**

Dan:

> **Do not reopen the Question Architecture that V17.11 has already frozen.**

Tujuan V18 hanya satu:

> **Ketika customer membalas ReadyScore melalui WhatsApp, tim ReadyScore dapat melihat percakapan tersebut, memahami context customer, dan membalas langsung dari ReadyScore dengan aman dan dapat diaudit.**
