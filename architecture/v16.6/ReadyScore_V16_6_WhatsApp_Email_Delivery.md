# ReadyScore V16.6 — WhatsApp & Email Delivery

## Status
Development implementation baseline.

## Objective
Membuat external delivery Free Report reliable dan observable tanpa mengubah arsitektur V16 yang sudah PASS.

## Scope
- WhatsApp Cloud API media upload.
- WhatsApp document message.
- Resend email dengan PDF attachment.
- Provider configuration validation at runtime.
- Timeout dan network error mapping.
- Delivery status persistence.
- Manual retry untuk `FAILED` dan `SKIPPED`.
- Safe provider error persistence tanpa token atau response body provider.
- Email tetap menjadi secondary/backup channel ketika email tersedia.
- Free Report tetap dapat diakses ketika provider gagal atau belum dikonfigurasi.

## Runtime contract

### WhatsApp
Required environment variables:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_VERSION
```

Flow:

```text
PDF Buffer
  ↓
WhatsApp Media Upload
  ↓
Media ID
  ↓
Document Message
  ↓
whatsappStatus = SENT / FAILED / SKIPPED
```

PDF tidak dikirim sebagai raw Base64 langsung ke document message.

### Email
Required environment variables:

```text
RESEND_API_KEY
READYSCORE_EMAIL_FROM
```

Flow:

```text
PDF Buffer
  ↓
Resend API
  ↓
PDF attachment
  ↓
emailStatus = SENT / FAILED / SKIPPED
```

## Error handling
Provider response body tidak disimpan ke database dan tidak dikirim ke client.

Mapped errors menggunakan safe codes, antara lain:

```text
WHATSAPP_PROVIDER_NOT_CONFIGURED
WHATSAPP_RECIPIENT_INVALID
WHATSAPP_MEDIA_UPLOAD_FAILED:<status>
WHATSAPP_MEDIA_UPLOAD_TIMEOUT
WHATSAPP_MEDIA_UPLOAD_NETWORK_FAILED
WHATSAPP_MESSAGE_FAILED:<status>
WHATSAPP_MESSAGE_TIMEOUT
WHATSAPP_MESSAGE_NETWORK_FAILED
EMAIL_PROVIDER_NOT_CONFIGURED
EMAIL_RECIPIENT_INVALID
EMAIL_SEND_FAILED:<status>
EMAIL_SEND_TIMEOUT
EMAIL_SEND_NETWORK_FAILED
```

Timeout mencegah request provider menggantung tanpa batas.

## Retry
- `SENT` tidak dikirim ulang.
- `FAILED` dapat dicoba kembali.
- `SKIPPED` dapat dicoba kembali setelah provider tersedia.
- PDF `GENERATED` yang valid tidak dibuat ulang.
- UI menyediakan retry manual.
- Lead dan premium transaction tidak disentuh oleh retry delivery.

## Duplicate-send protection
Unlock flow tidak lagi memicu delivery secara terpisah ketika `FreeReportDeliveryStatus` juga memicunya. Satu UI flow hanya memiliki satu automatic delivery trigger.

Server tetap idempotent per channel melalui persisted `SENT` state.

## Security
- Secrets hanya dibaca dari environment.
- Token/API key tidak pernah disimpan di database.
- Provider response body tidak pernah dicatat.
- Client hanya menerima safe application messages.

## Non-goals
- WhatsApp broadcast.
- Email campaign engine.
- Marketing automation.
- CRM redesign.
- AI.
- Approved WhatsApp template campaign system.

## Verification
Required:

```text
pnpm v16:5:gate
pnpm v16:6:gate
pnpm typecheck
pnpm build
```

Runtime validation harus menggunakan provider configuration nyata untuk membuktikan `SENT`. Provider yang tidak dikonfigurasi harus menghasilkan `SKIPPED` tanpa merusak Free Report.

## V16.6.1 Delivery Concurrency Hardening

### Problem addressed
Development-mode React Strict Mode can invoke the result-page delivery effect more than once. Concurrent POST requests could otherwise observe the same `NOT_ATTEMPTED` state and both call external providers before either request persisted `SENT`.

### Protection layers
1. **Client in-flight deduplication**
   - One in-flight `/api/free/delivery` request is allowed per `attemptId` in the browser runtime.
   - A second Strict Mode mount or rapid trigger reuses the existing request instead of creating another provider request.

2. **Database delivery lease**
   - `FreeReportDelivery.processingUntil` and `processingToken` form a short-lived server-side lease.
   - Only one request can claim an attempt at a time.
   - A stale worker cannot clear a newer worker's lease because cleanup is token-scoped.
   - Lease duration is 90 seconds, longer than the current provider timeout budget.

3. **Resend idempotency**
   - Email requests send an `Idempotency-Key` based on the delivery event, attempt ID, and normalized recipient.
   - This protects against duplicate email requests reaching Resend within its idempotency window.

### Email content
The Free Report email uses a concise transactional message with:
- recipient full name;
- attached Free Report PDF;
- a short explanation of the report's purpose;
- CTA to `https://app.readyscore.id/register`;
- ReadyScore WhatsApp contact `+62 811 9696 2200`;
- ReadyScore support email `hola@readyscore.id`.

### Verification addition
The V16.6 runtime regression must verify that two concurrent delivery requests for the same `attemptId` result in only one external email delivery and do not create duplicate business delivery state.
