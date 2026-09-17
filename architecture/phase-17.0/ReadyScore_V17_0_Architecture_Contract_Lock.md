# ReadyScore V17 — WhatsApp Inbox & Customer Conversation Platform

**Status:** Draft / Architecture Baseline  
**Project:** ReadyScore  
**Previous baseline:** V16.8.4 — Production Runtime Certified  
**New V17 focus:** Native WhatsApp Inbox at `app.readyscore.id/admin/whatsapp`  
**Product principle:** Own the customer conversation layer without depending on a third-party inbox provider.

---

# 1. V17 Executive Definition

ReadyScore V17 adds a first-party WhatsApp Inbox directly inside ReadyScore.

The objective is to allow authorized ReadyScore admins to:

- receive incoming WhatsApp messages;
- view conversations;
- read message history;
- reply to customers;
- manage unread/read state;
- see customer context;
- connect conversations to existing Business Leads;
- see assessment / Free Report context where available;
- retain conversation history;
- use the same Meta WhatsApp Cloud API number already used by ReadyScore.

Primary route:

```text
https://app.readyscore.id/admin/whatsapp
```

V17 is **not** a new WhatsApp provider.

The existing Meta WhatsApp Cloud API remains the communication provider.

```text
Customer WhatsApp
        |
        v
Meta WhatsApp Cloud API
        |
        +--------------------+
        |                    |
        v                    v
Inbound Webhook          Outbound Graph API
        |                    ^
        v                    |
ReadyScore API -------------+
        |
        v
Conversation / Message DB
        |
        v
Admin WhatsApp Inbox
```

---

# 2. V16.8.4 Baseline — MUST REMAIN INTACT

V17 starts from the production-certified V16.8.4 baseline.

The following V16 capabilities are considered locked:

- Free RIASEC Assessment
- Free result
- Free Lead Capture
- Business Lead creation/reuse
- consent preservation
- source attribution
- Free Report generation
- PDF download
- WhatsApp Free Report delivery
- Email delivery
- delivery concurrency protection
- email idempotency
- premium offer
- checkout
- entitlement
- admin lead visibility
- V15.2 regression boundaries
- production build
- production runtime delivery

V17 MUST NOT redesign these systems.

V17 extends the existing WhatsApp capability from:

```text
Outbound delivery
```

to:

```text
Two-way customer conversation
```

---

# 3. Important Product Decision

## V17 replaces the dependency on third-party inbox providers

The product direction is:

> ReadyScore should own its customer conversation experience.

Kirimi / third-party inbox providers are therefore **not part of the V17 architecture**.

The ReadyScore number remains connected to Meta WhatsApp Cloud API.

No migration to Coexistence is required for V17.

No QR-based WhatsApp integration is required.

No WhatsApp Web automation is allowed.

No unofficial WhatsApp API is allowed.

---

# 4. Existing WhatsApp Production Identity

The existing production WhatsApp configuration remains the source of truth.

```text
Meta App:
WAReadyScore

WhatsApp Business Account ID:
1394892188831173

Phone Number ID:
1341235719073518

Phone Number:
+62 811-9696-2200

Graph API version:
v23.0 default in current ReadyScore source
```

Secrets:

```text
WHATSAPP_ACCESS_TOKEN
```

MUST remain server-side only.

The token MUST:

- never be returned to the browser;
- never be logged;
- never be stored in the database;
- never be committed to Git;
- never appear in API responses;
- never appear in screenshots or test output.

---

# 5. V17 Product Principle

## Conversation First

The Inbox is the operational center for customer communication.

Every WhatsApp conversation should answer:

1. Who is this customer?
2. What did they say?
3. What did ReadyScore previously send?
4. What assessment context exists?
5. What Business Lead does this belong to?
6. Can the admin reply now?
7. What happened most recently?

The inbox should minimize context switching.

---

# 6. V17 Scope

## 6.1 In Scope

### A. WhatsApp Webhook

- webhook verification;
- inbound message receiving;
- provider event validation;
- message normalization;
- duplicate event protection;
- message persistence;
- delivery/status event handling;
- safe error handling.

### B. Conversation

- automatic conversation creation;
- conversation reuse;
- conversation list;
- latest message;
- unread count;
- read state;
- last activity;
- customer phone number;
- customer display name when available.

### C. Message

Minimum message types:

- text inbound;
- text outbound;
- document outbound;
- delivery status;
- read status;
- failed status.

Media inbound can be designed for extensibility but is not required for the first V17 release.

### D. Admin Inbox

- conversation sidebar;
- message timeline;
- composer;
- unread state;
- read state;
- latest message;
- customer information panel;
- Business Lead context;
- assessment context;
- delivery state.

### E. Outbound Reply

Admin can send text replies through the same Meta Cloud API number.

### F. Business Lead Integration

Conversation can be linked to an existing Business Lead.

The system should reuse the V16.7 identity logic where possible.

### G. Customer Context

Where available, show:

- name;
- WhatsApp number;
- email;
- source;
- assessment attempt;
- RIASEC result;
- Free Report status;
- Business Lead;
- last interaction.

V17 MUST NOT create a second CRM identity system.

---

# 7. Explicitly Out of Scope

The following are NOT V17 requirements:

- AI chatbot;
- AI Career Advisor;
- automated AI replies;
- lead scoring;
- campaign management;
- broadcast management;
- bulk messaging;
- marketing automation;
- WhatsApp group management;
- WhatsApp Web automation;
- QR-based unofficial API;
- third-party WhatsApp provider dependency;
- full CRM;
- sales pipeline redesign;
- ticketing system;
- omnichannel inbox;
- Instagram inbox;
- Messenger inbox;
- email inbox;
- advanced analytics;
- chatbot builder;
- template management UI;
- multi-business WhatsApp tenancy.

These can be future versions.

---

# 8. V17 Architecture

## 8.1 Logical Architecture

```text
                    +----------------------+
                    |   WhatsApp Customer  |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Meta WhatsApp Cloud  |
                    |        API           |
                    +----------+-----------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
       Webhook Events                     Graph API Send
              |                                 ^
              v                                 |
     +--------------------+                     |
     | ReadyScore API     |---------------------+
     +---------+----------+
               |
       +-------+--------+
       |                |
       v                v
+-------------+   +-------------+
| Conversation|   | BusinessLead|
| Message     |   | / Assessment|
+------+------+   +-------------+
       |
       v
+----------------------------+
| Admin WhatsApp Inbox       |
| /admin/whatsapp            |
+----------------------------+
```

---

# 9. Backend Bounded Context

Create a dedicated WhatsApp domain without breaking existing domains.

Suggested structure:

```text
apps/api/
  src/
    whatsapp/
      whatsapp.module.ts
      whatsapp.controller.ts
      whatsapp.service.ts

      webhook/
        whatsapp-webhook.controller.ts
        whatsapp-webhook.service.ts
        whatsapp-signature.service.ts

      conversation/
        conversation.service.ts
        conversation.repository.ts

      message/
        message.service.ts
        message.repository.ts

      provider/
        whatsapp-cloud-api.client.ts
        whatsapp-cloud-api.types.ts

      dto/
        send-whatsapp-message.dto.ts
        mark-conversation-read.dto.ts

      types/
        whatsapp.types.ts
```

Exact file placement may follow the existing ReadyScore architecture if equivalent modules already exist.

Do NOT introduce a second backend framework or provider abstraction unless required.

---

# 10. Frontend Architecture

Suggested route:

```text
app/admin/whatsapp/page.tsx
```

Suggested components:

```text
components/admin/whatsapp/
  WhatsAppInbox.tsx
  ConversationList.tsx
  ConversationListItem.tsx
  ConversationHeader.tsx
  MessageTimeline.tsx
  MessageBubble.tsx
  MessageComposer.tsx
  CustomerContextPanel.tsx
  ConversationStatus.tsx
```

The exact component structure may follow the existing admin design system.

Do not introduce a separate UI framework.

---

# 11. Database Model

V17 should introduce only the minimum required persistence layer.

## 11.1 WhatsAppConversation

Suggested fields:

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

Suggested status:

```text
OPEN
CLOSED
```

Do not overbuild conversation states.

---

# 12. WhatsAppMessage

Suggested fields:

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

Initial V17 implementation only requires:

```text
TEXT
DOCUMENT
```

for operational completeness.

---

# 13. Idempotency Rules

This is mandatory.

Meta can deliver webhook events more than once.

Therefore:

```text
externalMessageId
```

MUST be unique whenever Meta supplies it.

Inbound processing must be idempotent:

```text
Webhook event
      |
      v
Extract provider message ID
      |
      v
Already exists?
   /        \
 yes         no
 |            |
ignore       persist
```

Duplicate webhook delivery MUST NOT create duplicate messages.

Duplicate outbound operations MUST NOT create unintended duplicate messages.

---

# 14. Webhook Security

The webhook endpoint must implement Meta's webhook verification mechanism.

GET verification:

```text
hub.mode
hub.verify_token
hub.challenge
```

POST webhook requests must validate the provider signature where applicable.

Expected header:

```text
X-Hub-Signature-256
```

Verification must use the server-side app secret.

The app secret MUST NOT be exposed to the browser.

Suggested environment variables:

```env
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=
```

Existing production secrets must remain secret.

---

# 15. Webhook Endpoint

Suggested endpoint:

```text
GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

Requirements:

### GET

- validate verification token;
- return challenge only on successful verification;
- reject invalid verification.

### POST

- validate signature;
- parse event;
- acknowledge quickly;
- process safely;
- persist inbound message;
- update conversation;
- process delivery/read status events.

The endpoint must avoid long-running synchronous operations.

---

# 16. Webhook Processing

Recommended flow:

```text
Meta Webhook
     |
     v
Verify Signature
     |
     v
Parse Event
     |
     +---- status event ------> update message status
     |
     +---- inbound message ---> idempotency check
                                  |
                                  v
                           find/create conversation
                                  |
                                  v
                           find Business Lead
                                  |
                                  v
                           persist message
                                  |
                                  v
                           update unread
                                  |
                                  v
                              ACK / done
```

Webhook processing MUST be resilient to:

- duplicate events;
- missing optional fields;
- unknown message types;
- unknown status types;
- malformed payloads;
- provider retries;
- temporary database errors.

Unknown event types should be safely ignored and logged without secrets.

---

# 17. Conversation Identity

The primary customer identity for WhatsApp is:

```text
phoneNumber
```

Normalization is mandatory.

Example:

```text
+62 811-9696-2200
6281196962200
0811-9696-2200
```

must normalize to a canonical representation.

The implementation must reuse existing normalization utilities if already available.

Do not create multiple conversations for the same customer because of formatting differences.

---

# 18. Business Lead Linking

V16.7 already establishes:

```text
BusinessLead
```

V17 should link:

```text
WhatsAppConversation.businessLeadId
```

where a reliable match exists.

Matching priority:

1. normalized WhatsApp number;
2. normalized email where available;
3. explicit admin link.

Never guess identity from name alone.

If no Business Lead exists:

```text
Conversation
    |
    +--> no Business Lead
```

must remain valid.

The inbox must still work.

---

# 19. Admin Authorization

The inbox is private operational data.

Minimum requirement:

```text
Authenticated admin
```

Only authorized admin users may:

- view conversations;
- view messages;
- send messages;
- mark messages read;
- link Business Leads.

Unauthorized access:

```text
401 Unauthorized
```

Authenticated but insufficient privilege:

```text
403 Forbidden
```

Existing ReadyScore RBAC/authentication conventions must be reused.

Do not create a second authorization mechanism.

---

# 20. Admin Inbox UX

Primary screen:

```text
/admin/whatsapp
```

Three-column layout is preferred:

```text
+----------------+------------------------+-------------------+
| Conversations  | Message Timeline       | Customer Context  |
|                |                        |                   |
| Search         | Customer               | Name              |
|                |                        | WhatsApp          |
| Unread         | messages              | Email             |
|                |                        | Business Lead     |
| Customer A     |                        | Assessment        |
| Customer B     |                        | Free Report       |
| Customer C     |                        | Delivery          |
+----------------+------------------------+-------------------+
```

Responsive behavior:

- desktop: three columns;
- tablet: two columns;
- mobile: stacked navigation.

---

# 21. Conversation List

Each item should show:

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

Default view:

```text
OPEN conversations
```

Search:

- name;
- phone number.

Filtering can remain minimal for V17.

---

# 22. Message Timeline

Each message should show:

```text
message
timestamp
direction
status
```

Outbound:

```text
Admin
   ↓
WhatsApp
```

Inbound:

```text
Customer
   ↓
ReadyScore
```

Statuses:

```text
SENDING
SENT
DELIVERED
READ
FAILED
```

The UI should not claim delivery/read unless confirmed by provider events.

---

# 23. Reply Composer

Initial V17 composer:

```text
textarea
Send
```

Requirements:

- Enter to send;
- Shift+Enter for newline;
- disabled while sending;
- clear after confirmed send;
- show failure state;
- allow retry only when safe.

Text messages only for the first inbox release.

Document/media sending may reuse existing Free Report delivery infrastructure where appropriate, but is not required for admin composer V17.1.

---

# 24. WhatsApp Conversation Window

The implementation must respect Meta WhatsApp messaging rules.

The system must distinguish:

```text
customer-initiated conversation
```

from situations where:

```text
template message
```

is required.

V17 must not implement an unsafe "send anything anytime" behavior.

If the provider rejects an outbound message because a template is required:

```text
status = FAILED
```

and the UI should show a useful operational error.

Do not fake successful delivery.

---

# 25. Outbound Message Architecture

Use the existing provider integration as the foundation.

Suggested service:

```text
WhatsAppCloudApiClient
```

Responsibilities:

- build Graph API request;
- attach authorization;
- send message;
- parse provider response;
- return provider message ID;
- map errors;
- never expose access token.

Do not duplicate WhatsApp API code across controllers.

---

# 26. Delivery Status Synchronization

Meta status events should update outbound messages.

Example:

```text
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

The database must retain the latest known provider status.

---

# 27. Customer Context Panel

The right-side context panel should show existing ReadyScore information only.

Suggested sections:

### Customer

```text
Name
WhatsApp
Email
```

### Business Lead

```text
Lead status
Source
Created at
```

### Assessment

```text
Assessment attempt
RIASEC result
```

### Free Report

```text
Generated
Downloaded
WhatsApp delivery
Email delivery
```

No new CRM profile system.

---

# 28. Auditability

Important admin actions should be auditable where the existing audit infrastructure supports it.

At minimum:

```text
admin sent WhatsApp message
admin linked conversation
admin marked conversation read
```

Audit records should include:

```text
actor
action
target
timestamp
```

Never store access tokens in audit data.

---

# 29. Logging Rules

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

Phone numbers should be masked in operational logs when practical.

---

# 30. Error Handling

Provider errors must be mapped into safe application errors.

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

The admin UI should show an actionable message without exposing raw secrets.

---

# 31. Performance Rules

Webhook:

- acknowledge quickly;
- no expensive rendering;
- no PDF generation inside webhook request;
- no external API chain unless necessary.

Inbox:

- paginated conversations;
- paginated messages;
- no loading entire history;
- newest messages first at database level where practical;
- lazy-load older messages.

Suggested initial limits:

```text
Conversation list: 50
Message page: 50
```

---

# 32. Data Retention

V17 should not automatically delete conversation history.

Retention policy should remain configurable.

For MVP:

```text
No automatic deletion.
```

Future retention policy can be introduced separately.

---

# 33. API Surface

Suggested endpoints:

```text
GET    /api/admin/whatsapp/conversations
GET    /api/admin/whatsapp/conversations/:id
GET    /api/admin/whatsapp/conversations/:id/messages

POST   /api/admin/whatsapp/conversations/:id/messages
POST   /api/admin/whatsapp/conversations/:id/read
POST   /api/admin/whatsapp/conversations/:id/link-lead

GET    /api/webhooks/whatsapp
POST   /api/webhooks/whatsapp
```

The final naming must follow existing ReadyScore API conventions.

---

# 34. API Response Rules

Use the existing API response contract.

Do not introduce a second response envelope.

Typical:

```json
{
  "ok": true,
  "data": {}
}
```

Errors should follow existing project conventions.

---

# 35. Security Requirements

Mandatory:

- authentication;
- authorization;
- webhook verification;
- signature validation;
- server-side token;
- server-side app secret;
- input validation;
- output sanitization;
- rate limiting for admin send endpoint;
- audit logging;
- no secret logging.

Do not expose Meta credentials through:

```text
GET /api/admin/whatsapp/config
```

or any frontend payload.

---

# 36. Database Constraints

Mandatory:

```text
WhatsAppMessage.externalMessageId UNIQUE
```

Conversation identity must have a deterministic uniqueness strategy.

Recommended:

```text
phoneNumber + channel
```

where:

```text
channel = WHATSAPP
```

This allows future omnichannel expansion without redesigning identity semantics.

---

# 37. Future-Proofing

V17 should be WhatsApp-first but not WhatsApp-locked at the database level.

Use:

```text
channel = WHATSAPP
```

for conversation identity.

Future channels could theoretically become:

```text
WHATSAPP
EMAIL
INSTAGRAM
MESSENGER
```

But **do not implement them in V17**.

---

# 38. Analytics

Minimal operational analytics only:

- total conversations;
- unread conversations;
- inbound messages;
- outbound messages;
- failed outbound messages.

No advanced dashboard is required.

Existing funnel analytics remain intact.

---

# 39. V17 Definition of Done

V17 is PASS only when all are true:

### Webhook

- Meta verification works;
- inbound WhatsApp event reaches ReadyScore;
- signature validation works;
- duplicate webhook does not duplicate message.

### Conversation

- new customer creates conversation;
- existing customer reuses conversation;
- phone normalization works;
- unread count works;
- message history persists.

### Inbox

- authorized admin can access `/admin/whatsapp`;
- conversations load;
- messages load;
- unread state works;
- customer context loads.

### Reply

- admin can send text;
- message is persisted;
- provider message ID is stored;
- provider status is reflected;
- failure is shown correctly.

### Business Lead

- existing Business Lead can be matched;
- conversation can be linked;
- no duplicate identity system is created.

### Security

- unauthorized user cannot access inbox;
- unauthorized user cannot send;
- webhook verification works;
- access token is never exposed;
- app secret is never exposed.

### Regression

All V16.8.4 functionality remains intact:

- Free Assessment;
- Free Lead Capture;
- Business Lead;
- Free Report;
- PDF;
- WhatsApp outbound;
- Email;
- Premium;
- Checkout;
- Entitlement.

### Production

- typecheck PASS;
- build PASS;
- V16 regression PASS;
- V17 static gates PASS;
- local webhook E2E PASS;
- local inbox E2E PASS;
- production smoke PASS;
- production real WhatsApp inbound PASS;
- production real admin reply PASS.

---

# 40. Development Rules

## Rule 1 — Start from V16.8.4

Do not start V17 from an older ZIP.

---

## Rule 2 — No Architecture Rewrite

Do not rewrite:

- authentication;
- BusinessLead;
- Free Report;
- delivery;
- checkout;
- entitlement.

Extend them.

---

## Rule 3 — No Third-Party Inbox Dependency

Kirimi is not a V17 architectural dependency.

---

## Rule 4 — Meta Cloud API Only

Use the official Meta WhatsApp Cloud API.

No:

- QR automation;
- WhatsApp Web scraping;
- unofficial libraries;
- device emulation.

---

## Rule 5 — No Fake Provider Success

If Meta says failed:

```text
FAILED
```

If Meta says sent:

```text
SENT
```

Never infer provider success from HTTP request completion alone.

---

## Rule 6 — Idempotency First

Webhook duplication must be expected, not treated as an exceptional scenario.

---

## Rule 7 — Existing Identity First

Reuse:

```text
BusinessLead
```

and existing normalization.

Do not create another customer table unless absolutely required.

---

## Rule 8 — Security by Default

Secrets never enter:

- browser;
- logs;
- database;
- Git;
- screenshots.

---

## Rule 9 — Regression Awareness

Every V17 change must preserve V16.8.4.

---

## Rule 10 — Local First

No production modification until:

```text
typecheck PASS
build PASS
static gate PASS
V16 regression PASS
V17 E2E PASS
```

---

## Rule 11 — Production Must Be Runtime Tested

Build success alone is insufficient.

Production must prove:

```text
Meta → ReadyScore Webhook
ReadyScore → Meta
```

with real messages.

---

## Rule 12 — Do Not Claim PASS Prematurely

PASS means actual validation succeeded.

If a dependency is unavailable:

```text
SKIPPED
```

not PASS.

---

# 41. Development Phase Plan

V17 should be developed in controlled phases.

## Phase 17.0 — Architecture & Contract Lock

Objective:

- lock V17 scope;
- lock database model;
- lock webhook contract;
- lock API surface;
- lock security boundaries;
- lock admin UX structure.

Deliverables:

```text
architecture
database specification
API contract
webhook contract
security contract
phase gates
```

Gate:

```text
V17.0 PASS
```

---

## Phase 17.1 — WhatsApp Webhook Foundation

Objective:

Build the inbound Meta webhook.

Scope:

- GET verification;
- POST endpoint;
- signature verification;
- payload parsing;
- safe ACK;
- environment configuration;
- logging;
- basic event normalization.

Gate:

```text
Webhook verification PASS
Webhook payload parsing PASS
Signature validation PASS
```

No inbox UI yet.

---

## Phase 17.2 — Conversation & Message Persistence

Objective:

Persist inbound/outbound conversation data.

Scope:

- WhatsAppConversation;
- WhatsAppMessage;
- indexes;
- unique constraints;
- phone normalization;
- idempotency;
- migrations.

Gate:

```text
duplicate webhook PASS
conversation reuse PASS
message persistence PASS
```

---

## Phase 17.3 — Admin Inbox Read Model

Objective:

Build the inbox viewing experience.

Scope:

- `/admin/whatsapp`;
- conversation list;
- message timeline;
- unread count;
- read state;
- pagination;
- customer context.

Gate:

```text
admin authorization PASS
conversation list PASS
message history PASS
context panel PASS
```

No outbound reply yet.

---

## Phase 17.4 — Admin Reply

Objective:

Allow admins to send text replies.

Scope:

- composer;
- Meta Graph API client;
- outbound message persistence;
- provider message ID;
- provider errors;
- sending state;
- delivery state.

Gate:

```text
admin send PASS
provider SENT PASS
failure handling PASS
```

---

## Phase 17.5 — Business Lead & ReadyScore Context

Objective:

Connect conversations with the existing ReadyScore customer context.

Scope:

- BusinessLead matching;
- explicit lead linking;
- assessment reference;
- Free Report status;
- delivery status;
- context panel refinement.

Gate:

```text
BusinessLead linking PASS
context accuracy PASS
no duplicate identity PASS
```

---

## Phase 17.6 — Production Hardening

Objective:

Make the inbox safe for production.

Scope:

- rate limits;
- webhook retry safety;
- idempotency hardening;
- audit events;
- logging hardening;
- error mapping;
- security headers;
- performance;
- pagination;
- regression suite.

Gate:

```text
security PASS
performance PASS
regression PASS
```

---

## Phase 17.7 — Full Local E2E Certification

Objective:

Certify the complete V17 flow locally.

Test:

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
Meta-like provider response
      ↓
Status update
```

Also run:

```text
V15 regression
V16.5 regression
V16.6 regression
V16.7 regression
V16.8 regression
```

Gate:

```text
V17 FULL LOCAL CERTIFICATION — PASS
```

---

## Phase 17.8 — Production Deployment & Runtime Certification

Only after Phase 17.7 PASS.

Sequence:

```text
commit
↓
git status clean
↓
push
↓
VPS pull
↓
install
↓
migration
↓
Prisma generate if required
↓
build
↓
PM2 restart
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

Gate:

```text
V17 PRODUCTION RUNTIME — PASS
```

---

# 42. Phase Completion Policy

Every phase must have:

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

A phase does not become PASS because code exists.

---

# 43. Recommended V17 MVP Boundary

The first production release should contain only:

```text
Inbound text
Conversation
Message history
Unread/read
Admin reply text
Delivery status
Business Lead context
Admin authorization
Webhook security
Idempotency
Auditability
```

Everything else should wait.

This keeps V17 focused.

---

# 44. V17 Success Definition

The final V17 experience should be:

```text
Customer sends WhatsApp
        ↓
Meta
        ↓
ReadyScore Webhook
        ↓
Conversation appears
        ↓
Admin opens:
app.readyscore.id/admin/whatsapp
        ↓
Admin sees:
- customer
- conversation
- Business Lead
- assessment
- Free Report
        ↓
Admin replies
        ↓
Meta Cloud API
        ↓
Customer receives reply
        ↓
Delivery status returns
        ↓
Inbox updates
```

That is the complete V17 value proposition.

---

# 45. Future Versions

Possible future scope, NOT V17:

### V18

AI Career Advisor / AI-assisted customer conversation.

Potential capabilities:

- suggested replies;
- customer context summarization;
- career questions;
- lead assistance.

### Future

- WhatsApp templates;
- media inbox;
- campaign;
- broadcast;
- omnichannel;
- advanced conversation analytics;
- SLA;
- assignment;
- team routing.

These must not leak into V17 MVP.

---

# 46. Final V17 Architecture Lock

The architecture is:

```text
Meta WhatsApp Cloud API
          |
          +----------------------+
          |                      |
          v                      v
     Webhook                Graph API
          |                      ^
          v                      |
     ReadyScore API -------------+
          |
          +--------------------+
          |                    |
          v                    v
 Conversation             BusinessLead
 Message                   Assessment
          |                Free Report
          +--------+-----------+
                   |
                   v
        ReadyScore Admin Inbox
        /admin/whatsapp
```

Core principle:

> **Own the conversation, not the WhatsApp infrastructure.**

Meta remains the WhatsApp infrastructure.

ReadyScore owns:

- conversation data;
- customer context;
- inbox;
- operational workflow;
- admin experience.

---

# 47. Final Development Commandment

> **Do not rebuild WhatsApp. Build the ReadyScore operational layer on top of Meta WhatsApp Cloud API.**

V17 must remain focused on one problem:

> **When a customer replies to ReadyScore on WhatsApp, the ReadyScore team must be able to see it, understand the customer context, and reply from ReadyScore itself.**
