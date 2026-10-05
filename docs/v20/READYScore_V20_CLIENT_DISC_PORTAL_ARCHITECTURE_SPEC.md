# ReadyScore Client DISC Portal — Architecture, Product Rules, and Phase Plan

**Document status:** V20 implementation and deployment record
**Prepared:** 2026-10-05
**Target:** Fast, demonstrable client DISC workflow built on the existing ReadyScore application
**Current production reference:** V20 client DISC portal deployed 2026-10-06; public DISC remains on its existing 80-question configuration
**Version assignment:** V20 Client DISC Portal, per product owner direction

---

## 1. Purpose

Define the smallest safe end-to-end organization workflow that allows a client to invite employees and candidates to a longer DISC assessment, view results in a client portal, and send each participant a result email with a PDF. The experience is distinct from the public ReadyScore consumer journey while reusing the existing application and assessment foundations where appropriate.

This document is the working baseline for implementation planning. It does not assert that the client portal, extended DISC package, or production delivery flow already exists.

## 2. Product Decisions and Scope

### 2.1 Confirmed direction

- Keep the development in the ReadyScore repository and application.
- Provide a client-only portal, separate in navigation and authorization from the public ReadyScore experience.
- Client users can create invitations and view completed DISC results in the application.
- Participants receive a private invitation, provide full name, email, and WhatsApp number, complete a client DISC assessment, then receive their result by email with a PDF.
- The participant-facing invitation and test show the inviting client's name and logo. ReadyScore is identified as the assessment provider (“Assessment provided by ReadyScore”).
- The result email may include ReadyScore promotion. Permission for future marketing is separate, optional, and recorded by channel; marketing consent is not a condition of taking the assessment or receiving the result.
- Participant records are classified as Candidate, Employee, or Alumni. Employee means currently employed; Candidate means in a hiring process; Alumni means formerly employed.
- Client DISC uses an extended package that may contain up to 100 questions and takes longer than the existing public DISC package.
- ReadyScore owns and versions question packages, duration, scoring, and interpretation. A client selects an enabled package but cannot change its instrument or scoring rules.
- DISC results support reflection and discussion. They must not be presented as an automated hiring decision or as a measure of a person's worth or ability.

### 2.2 Initial MVP boundary

**Included in the first client pilot:**

1. One organization record with name and logo.
2. A small client-user access model, initially one client administrator unless an existing safe RBAC pattern supports more roles cheaply.
3. Invitation creation, delivery, expiry, resend/revoke, and status tracking.
4. Participant identity/contact capture and a clear pre-test notice naming the client and explaining result visibility.
5. Candidate and Employee participant categories; Alumni lifecycle state supported in the data model and basic client list. Alumni invitation flow is not required for the first pilot.
6. One ReadyScore-managed extended DISC package, identified by immutable package/configuration version and its approved duration.
7. Resume-safe assessment progress, completion, scoring, and result persistence using the existing assessment engine contracts.
8. Client dashboard with invitation/assessment status, participant list, individual result view, and basic report summary.
9. Result email with participant PDF, client identity, and ReadyScore provider identity.
10. Audit events for sensitive access and lifecycle changes; tenant isolation and baseline operational monitoring.

**Explicitly deferred:**

- Client-authored questions or client-controlled scoring, interpretation, duration, or package composition.
- Custom report builders, benchmarking across clients, cohort comparisons, and advanced analytics.
- HRIS/ATS integrations, bulk provisioning, WhatsApp messaging, and participant self-service accounts.
- Complex client role hierarchies beyond what the existing authorization model can safely support for the pilot.
- Automated employment recommendations, candidate ranking, or pass/fail thresholds based on DISC.

### 2.3 Release/version reconciliation

The product owner has assigned this client DISC portal to V20. This release adds a client-only DISC package while preserving the public V19.7.2 DISC configuration and current production data. Any previously planned V20 Career Advisor work must be rescheduled in the roadmap separately.

### 2.4 Phase 0 initial repository findings (2026-10-05)

Read-only inspection of the local checkout found:

- The checkout is `/Users/marfreax/Github/ReadyScore`, branch `main`, tracking `origin/main`, at commit `e98549e` (`feat: complete ReadyScore V19.7 question bank v2`). This does not prove that the checkout is byte-for-byte the user-reported production V19.7.2 build; establish that baseline before implementation.
- Existing working-tree changes are present and must be preserved: `data/auth-state.json`, four untracked `data/v19/*WA_LP_V2*.sql` files, `docs/READYScore_Production_Deployment_Kaidah.md`, and this new specification. No code has been changed for the client portal.
- The app already has `Institution`, `InstitutionMembership`, and `InstitutionEntitlement` models and institutional access helpers. Their current roles and semantics are education-oriented (`TEACHER`, `STUDENT`, `PARENT`, etc.). Do not silently reinterpret them as client-company memberships; decide in Phase 0 whether to extend carefully or add a separate client organization boundary.
- The current DISC runtime is package/configuration-version driven, and the DISC scorer supports 24-item legacy and 80-item production forms. The runtime JSON under `data/question-bank/disc/` contains 24 questions. Two 80-question CSV files exist under `docs/VPS/FINAL/`; a local semantic comparison found the same 80 IDs, question text, options, and scoring keys in both files. Their row serialization differs. The `V18.3` reconciliation migration records `DISC_CONFIG_V2` as 80 questions with 20 questions in each target group, and the production-readiness E2E contract expects an 80-question DISC attempt with a 1,200-second timer. This is evidence of the current local/public contract, not a live production database read.
- The client requirement is a separate 100-question DISC package with a 30-minute duration. The public ReadyScore package remains 80 questions / 20 minutes. The client package reuses the public package's 80 immutable question identities through a separate client taxonomy and adds 20 original scenario items in a client-only package. The supplemental items are pilot content without established norms or psychometric validation; report them as descriptive discussion material, never as a standalone or automatic hiring decision. A content and measurement review is still required before treating this as a validated selection instrument.
- Existing report PDF generation and Resend email-with-attachment delivery are implemented for other ReadyScore flows. Reuse may be possible, but client branding, participant identity, report authorization, idempotency, and delivery status need a client-specific contract. The public consumer report PDF route is not a suitable participant-access mechanism without an explicit access review.
- `BusinessLead` and free-assessment capture already exist. Their global identity/deduplication behavior must not be assumed appropriate for organization participants or marketing leads; keep participant records tenant-scoped and link/create a marketing lead only under an explicit consent and deduplication rule.
- Product owner confirmed this work is V20 and authorized deployment after backup, migration recovery rehearsal, and release checks.

These findings narrow the implementation approach but do not yet validate the target production database's active DISC package, duration, or configuration.

## 3. Users and Access Surfaces

### 3.1 Client user

Authenticates into the organization portal (proposed route namespace: `/client`). Can manage allowed invitations and view only that organization's participants, assessments, and reports. The organization scope must be resolved server-side from the authenticated membership; a client-supplied organization ID is never an authorization boundary.

MVP role:

- **Client Admin:** manage organization profile, invitations, participant categories, and results for their organization.

Additional Viewer/Interviewer roles may follow after the authorization and assignment model is validated.

### 3.2 Participant

Uses an invitation-specific URL (proposed route namespace: `/invite/[token]`) and does not enter the public consumer dashboard. The invitation token identifies a scoped, expiring invitation; it is not a reusable account credential. Before the test, the participant sees:

- the client name and logo;
- “Assessment provided by ReadyScore”;
- why their information is requested;
- that the inviting client can view their assessment result;
- how the result will be delivered;
- a separate optional marketing preference for future ReadyScore communication.

Participants do not receive client dashboard access through the invitation.

### 3.3 ReadyScore operations

ReadyScore administration may create/verify organizations, enable assessment packages, and provide support using existing admin authentication/RBAC where possible. Do not introduce a parallel unrestricted admin authentication system.

## 4. Logical Architecture

```text
ReadyScore application
├── Public consumer experience (existing; protected baseline)
├── Client portal
│   ├── Organization profile and membership
│   ├── Invitation management
│   ├── Participant lifecycle: Candidate / Employee / Alumni
│   ├── DISC result dashboard and reports
│   └── Tenant-scoped APIs and audit events
├── Participant invitation experience
│   ├── Client-branded landing and notice
│   ├── Identity/contact capture
│   ├── Client DISC package runtime
│   └── Completion and result email/PDF delivery
└── Shared services
    ├── Existing authentication and authorization foundations
    ├── Existing assessment attempt/scoring/result runtime
    ├── Email delivery
    ├── Report/PDF generation
    └── Existing question package/configuration lifecycle
```

The portal is a distinct product surface and authorization domain within the ReadyScore app, not a separate fork of the repository. Reuse existing assessment, report, authentication, and admin primitives only after verifying their contracts fit organization-owned data and tenant isolation.

### 4.1 Suggested route/API boundaries

Routes below are conceptual. Reconcile with current App Router conventions before coding.

```text
/client                         client dashboard
/client/invitations             invitation list and create flow
/client/people                  Candidate / Employee / Alumni lists
/client/results/[id]            individual result
/client/reports                  client report workspace
/invite/[token]                 participant entry and test flow
/api/client/*                   authenticated, tenant-scoped client APIs
/api/invitations/[token]        narrowly scoped invitation APIs
```

Never expose internal scoring keys, package selection keys, or another tenant's records through participant/client APIs. Keep the public consumer routes and entitlements behavior unchanged.

## 5. Domain and Data Contracts

These are logical entities, not final Prisma model names. Phase 0 must map them to current schema and identify the smallest compatible migration.

### 5.1 Organization and membership

- **Organization:** stable ID, display name, logo asset reference, lifecycle status, timestamps.
- **OrganizationMembership:** organization ID, existing user ID, role, status, audit timestamps.
- Every client-owned record carries or derives an immutable organization ID.
- Tenant IDs are checked in server-side service/data access paths, including nested result, report, and PDF download paths.

### 5.2 Invitation and participant

- **ClientInvitation:** organization ID, inviter membership, normalized email, participant category, optional role/title and department labels, package version, status, expiry, sent/completed timestamps, revocation state, and safe token hash/reference.
- **OrganizationParticipant:** organization ID, full name, normalized email, WhatsApp number, current lifecycle category, first-seen/updated timestamps, and links to invitation/assessment history.
- A participant may have multiple assessment attempts over time; historical attempts retain their original category and package provenance.
- Duplicate matching is scoped to the organization and uses normalized contact data. Do not merge people across organizations based only on email or phone.
- Category change is an auditable lifecycle transition. Candidate → Employee may occur on hire; Employee → Alumni may occur on exit. Historical result and invitation records remain attached and retain their original context.

### 5.3 Assessment, result, report, and consent

- **OrganizationAssessment:** organization ID, participant ID, invitation ID, assessment type, immutable package/config version, attempt ID, status, start/completion timestamps, and result reference.
- Existing assessment attempt snapshot remains authoritative for scoring and provenance. The client assessment must not mutate or reinterpret a public assessment result.
- **ClientReport/ResultDelivery:** result/report version, generated timestamp, recipient, delivery state, and template version as needed for safe retries and observability.
- **Consent/NoticeRecord:** notice/consent version, purpose, channel, choice, timestamp, and source. Store optional marketing preference separately from required test/result processing acknowledgement.
- Result delivery is idempotent: retries must not create a second result or silently switch package/report versions.

## 6. Assessment Package and DISC Rules

### 6.1 Separate package, shared platform

The public ReadyScore DISC contract remains an 80-question forced-choice package with a 1,200-second duration. Client invitations pin a separate 100-question / 1,800-second package and its configuration version. The client package contains 80 copied immutable question identities under its own taxonomy plus 20 original scenario pilot items, with 25 questions assigned to each D/I/S/C target group. The package and configuration metadata mark it client-only and unnormed; this implementation does not establish reliability, validity, or job-relatedness. Do not change the public DISC configuration or present client scores as a sole hiring decision.

Package metadata should identify at minimum:

- assessment type DISC;
- package/configuration version and publication state;
- question count;
- allowed response contract;
- selection/composition rules;
- scoring and interpretation version;
- expected duration and resume behavior;
- effective dates and package compatibility.

The package and its scoring/interpretation contract are frozen once used by an attempt. New versions do not rewrite historical results. Internal scoring keys and mappings remain server-side and are excluded from sanitized runtime projections.

### 6.2 ReadyScore-controlled settings

ReadyScore owns question content, question count, selection, duration defaults, scoring, interpretation, and package publication. Client settings are limited initially to organization branding, participant category, allowed package selection (if multiple approved packages exist), invitation expiry, and result delivery policy. Do not offer per-client scoring or instrument customization in MVP.

### 6.3 Long assessment UX

- Display an honest duration estimate before starting.
- Persist progress safely and allow the participant to resume from the invitation link until expiry.
- Define inactivity/expiry behavior, duplicate submissions, browser refresh, and failed network recovery.
- Show progress without exposing scoring mappings.
- Do not reset an in-progress attempt when an invitation is resent.

## 7. Invitation and Participant Journey

1. Client admin creates an invitation with email, category, and optional job/unit labels.
2. Server validates client membership and package access; creates a scoped invitation and sends a transactional invitation email.
3. Participant opens the expiring, revocable invitation URL.
4. Branded entry page displays client name/logo, ReadyScore provider identity, notice, and required full name/email/WhatsApp fields.
5. Participant confirms the required notice and separately chooses whether to receive future ReadyScore marketing by offered channels.
6. Server normalizes and validates participant contact fields, associates participant/invitation within the organization, and creates/resumes the correct package-versioned attempt.
7. Participant completes the extended DISC assessment.
8. Existing DISC-specific scoring produces a versioned result; the result is visible to authorized client users only within the owning organization.
9. A result email is sent with a participant PDF. The email may contain a ReadyScore promotion. Marketing beyond the result message follows the separately recorded opt-in.
10. Invitation/assessment status and delivery outcome appear in the client portal.

Invitation status contract (minimum): `DRAFT`, `SENT`, `OPENED`, `IN_PROGRESS`, `COMPLETED`, `EXPIRED`, `REVOKED`, `DELIVERY_FAILED`. Define valid transitions; do not allow arbitrary client updates to status.

## 8. Branding, Result Email, and PDF

### 8.1 Branding

- Client name and approved logo identify the inviter on the invitation/test pages and participant-facing result.
- ReadyScore appears as the provider in a designated “Assessment provided by ReadyScore” area.
- Validate logo type, size, dimensions, and safe rendering; use a default client identity if no logo is configured.
- Email sender/domain identity follows the existing verified email provider configuration. Do not imply that the message is sent directly by a client unless mail delivery is actually configured for that client.

### 8.2 Result email and marketing

- Result email is transactional and is sent to the participant address captured/verified in the invitation flow.
- It identifies the client and ReadyScore, states that the client can view the result, and clearly labels the PDF.
- ReadyScore promotional content in the result message must be clearly promotional and distinguishable from the result delivery.
- Separate optional, purpose-specific preferences for future email and WhatsApp marketing. No preselected opt-in; no blocking the test/result for refusal.
- Record delivery state and safe provider references. Avoid logging full personal contact values or report contents.

### 8.3 PDF access

Initial user preference is a PDF in the result email. The implementation phase must choose between attachment and short-lived authenticated download link based on existing mail/PDF capabilities. If attached, treat it as forwardable and include only participant-appropriate content. If linked, use an unguessable, expiring, revocable token and tenant/result checks. Do not expose a public predictable report URL.

PDF contains participant name, assessment/package version or clear assessment date, result interpretation, client branding, ReadyScore provider identity, and a concise contextual disclaimer. It does not include raw scoring keys, hidden mappings, internal question metadata, or other participants' information.

## 9. Dashboard and Report Contract

### 9.1 Dashboard MVP

- Overview counts: invitations by status and completed assessments.
- Separate Candidate, Employee, and Alumni views/filters.
- Search and basic filters by date, category, assessment status, job/unit label.
- Individual result view with participant identity, completed date, package version, and DISC result.
- Clear distinction between not invited, invited, in progress, completed, expired, and delivery failure.
- Client user can resend/revoke permitted invitations and update participant lifecycle category with audit trail.

### 9.2 Report MVP

- Individual participant report is the source of truth for detailed DISC interpretation.
- Client report view provides a compact list/summary and access to individual results.
- Aggregate counts may be shown only with a clearly defined cohort and minimum privacy-safe grouping; omit small-cohort comparisons in the initial pilot.
- CSV/PDF export and advanced cohort analytics are deferred unless required for the client demo and explicitly scoped.
- Never rank candidates or generate automatic hire/reject recommendations from DISC.

## 10. Security, Privacy, and Operational Rules

- Enforce organization isolation in every read/write path, not only in the UI.
- Use existing authentication/session protections; no client-supplied organization ID may grant access.
- Invitation tokens are high-entropy, scoped, expiring, revocable, and stored safely (prefer hashed token material). Apply rate limits to token endpoints and contact capture.
- Client and participant access are separate; participant invitation tokens cannot access dashboards or list other participants.
- Protect contact data, assessment answers, results, PDFs, and consent records; use minimum necessary retention and documented deletion handling.
- Record audit events for invite creation/resend/revoke, participant category changes, result/report viewing or download, and organization-profile changes.
- Mask email/phone in operational logs where practical; never log invitation secrets, session cookies, authentication tokens, full report bodies, or internal scoring keys.
- Email/PDF failures are observable and retryable without duplicate assessment attempts or duplicate participant records.
- Use neutral error responses for unknown/expired/revoked tokens; do not disclose whether an unrelated participant exists.
- Keep consent/notice records versioned. Marketing choices remain optional and separate from participation/result delivery.
- Preserve public ReadyScore access, entitlements, scoring, reports, and historical data; no broad migration or data rewrite to enable the client portal.

## 11. Phase Plan and Exit Criteria

Phases are ordered to deliver a small end-to-end pilot quickly while keeping tenant and assessment boundaries ahead of UI polish. Each phase should be independently reviewable. Validate locally before any release/deployment; production rollout remains a separate explicit operation.

### Current implementation snapshot — 2026-10-05

| Phase | Local status | Remaining boundary |
|---|---|---|
| 0 — Baseline/product decisions | Separate client requirement confirmed: 100 questions / 30 minutes; public remains 80 / 20 minutes | Validate pilot content and migration/recovery rehearsal before any production application |
| 1 — Tenant/access | Organization schema, membership, admin provisioning, client self-onboarding, and tenant-scoped portal deployed to production | New client completes organization profile on first `/client` visit; cross-tenant acceptance walkthrough pending |
| 2 — DISC package | Separate client-only 100-question/30-minute package and scorer support implemented locally; public 80/20 contract remains pinned | Validate migration data, composition, scoring, invitation snapshot, and recovery path; supplemental items remain unnormed pilot content |
| 3 — Invitations/lifecycle | Create, resend, revoke, participant capture, category lists, and lifecycle audit deployed to production | Authenticated client walkthrough and privacy/accessibility review pending |
| 4 — Assessment/result delivery | Assessment submission, PDF email, persistent delivery state, and admin retry for failed email deployed to production | No test invitation/result email was sent during deployment; perform email/PDF rendering walkthrough with the client |
| 5 — Dashboard/report | Status overview, category counts, participant directory, individual result view, and searchable/filterable completed-report list deployed to production | Client acceptance and report presentation review pending |
| 6 — Release readiness | Full restore rehearsal passed; backup verified; all migrations through V20 applied; production build, PM2, database, and HTTPS smoke checks passed | Deployment complete; authenticated client end-to-end acceptance remains pending |

The full production-backup restore rehearsal was performed in a separate disposable database. Production itself remained unchanged during rehearsal. The env-configured development database is separate and retains its own local records.

### Migration recovery readiness — FULL PRODUCTION-BACKUP REHEARSAL PASSED

Production has an unfinished failure for `20260926100000_v18_3_runtime_data_reconciliation`: it attempted to insert `AssessmentConfigurationVersion` rows while `updatedAt` was NOT NULL and had no database default. Read-only production checks found no V18.3 FREE runtime package/configuration rows, but that alone is not proof that the whole failed migration had no effects. The normal `db:migrate:deploy` wrapper correctly stops when it sees an unresolved migration and must stay fail-closed.

The complete production backup was restored into an isolated PostgreSQL database and the exact production migration history was replayed through V20. The clone began with 42 successful migrations and one failed V18.3 migration. Before recovery, no V18.3 partial runtime rows were present. On the clone only, a temporary `CURRENT_TIMESTAMP` default allowed the failed migration to be marked rolled back and replayed; the default was removed after all 59 migrations succeeded. Final checks found 59 successful migrations, one recorded rollback, no unresolved migrations, 11 historical attempts and 11 results retained, zero client organizations seeded, public DISC active at 80 questions, and client DISC published at 100 questions / 1,800 seconds. The same recovery plan then ran in production after a fresh verified backup; the temporary default was removed when migration deployment succeeded. The migration deploy wrapper remains fail-closed.

### V20 production deployment record — 2026-10-06 (Asia/Jakarta)

- **Release commit:** `0e735f83604aa87536defc8ee268c752c8c29d83` (`feat: add V20 client DISC portal`), pushed to `origin/main` and fast-forwarded on the production host.
- **Pre-deploy backups:** `/var/backups/readyscore/readyscore-pre-v20-20261006-010404.dump` (7,658,864 bytes; SHA-256 `9b8764d81a5a12cea7ddc02e65d751309f842043987f02cc9b9171184465dbaf`) and `/var/backups/readyscore/readyscore-app-pre-v20-20261006-010404.tar.gz` (3,715,002 bytes; SHA-256 `8ade71bef440c0c67d9758afa7394d5f4d63b28cbe320c06b9e3a10cd5af4a1a`). Both archives were read/list validated and stored with mode 600.
- **Database:** recovery of the exact V18.3 failure was performed after backup verification; all migrations through V20 applied. Final ledger: 59 successful, one explicitly rolled back record for the old V18.3 failure, zero unresolved. The temporary `updatedAt` default was removed. Before/after counts: 11 assessment attempts, 11 results, 7 users; no client organizations or participants were created by migration.
- **Assessment package:** public DISC remains ACTIVE at 80 questions; client DISC is APPROVED/PUBLISHED at 100 questions and 1,800 seconds, with 100 published question versions. No live attempt or result was rewritten.
- **Application:** production build PASS, `BUILD_ID=F4_KMhirdHziMf7FqJj6L`; PM2 `readyscore` ONLINE after restart. Root and register pass HTTPS smoke (200); unauthenticated `/client` redirects to login; unauthenticated organization onboarding API returns 401. Email provider key and sender configuration are present. Existing PM2 error log's last modification predates deployment (2026-10-04 17:26 +07).
- **Functional verification boundary:** no production client account or organization existed at deployment time, so no invitation or result email was sent as a test. The client must register using the client entry URL and complete organization onboarding before an authenticated invite → assessment → PDF email → client report walkthrough can be verified. This avoids adding artificial customer/test records or sending an unsolicited email in production.
- **Result:** V20 code and schema are deployed and serving production traffic. Core build, database, and public HTTPS smoke gates PASS. Client authenticated end-to-end acceptance remains to be performed with the client's own account.

### Phase 0 — Baseline and product decisions

**Work:** Audit the current local code/schema against reported V19.7.2; inspect auth/RBAC, assessment attempt/result contracts, question package selection, email/PDF services, data deletion/audit patterns, and existing client/customer abstractions. Resolve the release-number conflict and lock the client extended DISC package source, number of items, duration, email/PDF mode, and client visibility policy.

**Exit:** Written implementation map, confirmed no conflict with existing uncommitted changes, migration impact known, version/package approved, and production behavior protected by named regression gates.

### Phase 1 — Organization tenancy and access foundation

**Work:** Add the minimum organization/membership/profile data contract and tenant-scoped authorization/service helpers. Add client portal shell and client admin entry using existing auth. Add audit events for client actions.

**Local progress:** The separate `ClientOrganization` and `ClientOrganizationMembership` schema/migrations, including the website URL field, active-membership lookup helpers, protected `/client` organization workspace, and ReadyScore admin provisioning page/API have been added locally. Both migrations are applied only to the local development database. ReadyScore admins can provision an organization, and a newly registered client account can create its first organization and become its administrator through the authenticated onboarding form. The current local database had no organization or membership before this onboarding was added. Organization creation is audited. Invitation creation, participant category changes, report-list views, and result views emit audit events. Participant directory supports Candidate, Employee, and Alumni categories, with category edits limited to organization admins.

**Exit:** Two test organizations cannot read or alter each other's records; unauthenticated users and public consumer users cannot enter client APIs; existing admin/public auth behavior remains unchanged.

### Phase 2 — Client DISC package contract

**Work:** Define and publish the extended DISC question package/configuration version, duration behavior, scoring/interpretation contract, and immutable attempt provenance. Implement server-side package selection and sanitized runtime projection. Add safe long-assessment resume behavior.

**Exit:** Package gate verifies exact item count/shape, mappings/scoring invariants, no scoring metadata leakage, deterministic result versioning, resume/submit behavior, and unchanged public DISC package behavior. Instrument content approval is an explicit prerequisite.

### Phase 3 — Invitations and participant lifecycle

**Work:** Client invitation CRUD/status flow, transactional email, scoped tokens, participant contact form, consent/notice version records, Candidate/Employee/Alumni lists and audited lifecycle transitions.

**Local progress:** Invitation creation and resend rotate the hashed token, set a new seven-day expiry, and use a distinct idempotency key per delivery attempt. Revocation disables the current token. Delivery failures return the one-time invitation URL to an authorized client admin for manual sharing. Sensitive lifecycle actions emit audit events. Candidate, Employee, and Alumni lists are separated; admins can change category, with Alumni transition restricted to people with Employee history.

**Exit:** Invite, open, resume, expire, revoke, resend, duplicate, and cross-tenant cases behave deterministically; marketing opt-in is optional and separate; invitation does not grant dashboard access.

### Phase 4 — Assessment completion and result delivery

**Work:** Complete client DISC attempt, produce versioned result, create participant-facing PDF, send result email, and record retryable delivery status.

**Local progress:** The client-specific attempt linkage, token-scoped start/resume/answer/submit APIs, result email with PDF attachment, and scoped client result view have been added locally. Email delivery state and attempt count are persisted. Authorized client admins can retry failed result delivery; delivery is atomically claimed and uses a per-attempt email idempotency key, without creating another assessment attempt. Local operational walkthrough and provider verification remain.

**Exit:** One completed attempt maps to one result/report delivery lifecycle; PDF and email show client and ReadyScore identities; failures can retry safely; no raw scoring keys or cross-participant data appear.

### Phase 5 — Client dashboard and reports

**Work:** Build invitation/status overview, participant category lists, individual DISC result view, and compact report summary. Add basic search/filter and permitted invitation actions.

**Local progress:** The organization dashboard now has distinct routes for overview, people directory, DISC invitations, reports, and organization settings, with a responsive left-side client menu. `/client` redirects directly to the summary when the account has exactly one workspace. The participant directory shows the primary/secondary DISC pattern and D/I/S/C choice shares, supports search/category/dominant-pattern filters, and gives admins explicit Candidate → Employee and Employee → Alumni actions. Those transitions are enforced and audited server-side. Organization admins can update the organization name, website URL, and logo URL. Individual results and report lists remain tenant-scoped; directory/report/result access is audited.

**Exit:** Authorized client sees only their organization; candidate/employee/alumni filters match lifecycle definitions; result data matches persisted attempt/package version; no automated hiring outcome is generated.

### Phase 6 — Pilot hardening and release readiness

**Work:** End-to-end pilot walkthrough, accessibility/responsive review, email/PDF rendering verification, migration/backup/rollback plan, operational alerts, client profile/logo validation, privacy/retention operations, and deployment runbook. Deployment certification records which runtime checks are verified and any pilot limitations.

**Exit:** Named acceptance checklist passes against a non-production organization and participant; security/tenant boundary review complete; rollback is documented; release notes and support procedure are ready. Only then schedule production rollout.

## 12. Acceptance Scenarios

1. A client administrator cannot view another organization's invitations, people, results, PDFs, or counts, including by changing URL IDs.
2. A participant invitation shows the correct client name/logo and ReadyScore provider label.
3. Participant must provide full name, email, and WhatsApp before starting; future marketing choice is optional and separately stored.
4. Client can invite Candidate or Employee; participant status is visible and Alumni lifecycle state can be maintained without deleting historical results.
5. Participant can resume an in-progress extended test without changing package version or losing saved answers.
6. Completed results preserve the exact package/scoring/interpretation version used at test time.
7. Client can view individual result only after authorization and within its organization.
8. Participant receives the correct result email/PDF once; retry does not create duplicate attempts or duplicate result records.
9. Result email/PDF identifies client and ReadyScore; any future marketing opt-in remains optional.
10. Public ReadyScore DISC journey and historical results behave as before.
11. DISC result is presented as discussion/reflection material, never as an automatic hiring decision.

## 13. Open Decisions (Resolve in Phase 0)

1. Package boundary is decided: public DISC remains 80 questions / 20 minutes; client DISC uses a separate 100-question / 30-minute package with 20 additional pilot scenario items. Those items are not normed or validated for selection use.
2. Invitation expiry is 7 days and resend resets it to 7 days. The assessment attempt follows the pinned package timer and remains resumable while its invitation is valid; validate this in the pilot walkthrough.
3. Result visibility: can the participant see the same full interpretation sent to the client, or a participant-specific version?
4. Delivery is decided as a PDF attachment to the participant result email.
5. Initial access supports organization Admin and Viewer roles; only Admin can invite, resend, revoke, change participant category, or retry result delivery. Both roles can view organization results.
6. Client context fields: are job title and department required for the initial demo, or optional labels?
7. Participant matching: can a participant use the same email in multiple organizations? Recommended yes, with strictly separate organization-scoped records.
8. Marketing channels are optional and recorded separately for email and WhatsApp. The result email itself remains transactional with clearly identified ReadyScore promotion.
9. Roadmap follow-up: reschedule any previously planned Career Advisor work displaced by this V20 client portal release.
10. Current repository state: which modified/untracked local files are intentional and must be preserved during implementation? No existing working-tree changes may be overwritten or reset.

## 14. Implementation Guardrails

- Start each implementation phase only after reading this document and completing its prerequisites.
- Inspect before editing; preserve all current user changes and untracked files.
- Do not deploy, push, or alter production data as part of local implementation phases.
- Do not silently change the public DISC instrument, report semantics, commercial entitlements, or auth behavior.
- Use the smallest migration and reuse established application patterns where the security contract fits.
- If a required client feature needs a materially different scoring instrument, stop and version the instrument contract before runtime implementation.
- Update this specification when an accepted product decision changes; record rationale and version rather than relying on chat history.
