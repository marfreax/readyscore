# ReadyScore V16.8.4 — WhatsApp Free Report Conversion Copy

## Basis
This is a minimal full-package correction based on the last passing **V16.8.3 Comprehensive E2E Certification Correction** baseline.

## Scope
V16.8.4 changes only the WhatsApp Free Report document caption and adds a regression gate for that copy.

## WhatsApp Copy
The PDF document caption now:

1. Greets the recipient by name.
2. Confirms that the Free Report is ready.
3. Briefly explains the value of the report.
4. Explicitly points the recipient to the attached report.
5. Introduces the next-step value proposition.
6. Presents four concrete ReadyScore benefits.
7. Provides the registration CTA:
   `https://app.readyscore.id/register`
8. Keeps an open support path by inviting the recipient to reply.
9. Ends with the ReadyScore brand line.

## Non-goals
- No database/schema change.
- No delivery architecture change.
- No WhatsApp API integration change.
- No email copy change.
- No PDF generation change.
- No authentication or entitlement change.
- No production deployment.

## Regression Gate
New package script:

`pnpm v16:8:4:gate`

The gate verifies the intended WhatsApp caption markers are present and the legacy short caption is absent.

The comprehensive certification suite invokes the V16.8.4 copy gate before V15.2 regression and runtime E2E.

## Definition of Done
- WhatsApp caption uses the new conversion-oriented copy.
- Registration URL is present.
- Recipient name remains dynamic.
- Legacy caption is absent.
- V16.8.4 static gate passes.
- Existing V16.5–V16.8 and V15.2 regression boundaries remain unchanged.
- Real WhatsApp delivery remains verified by the existing full-funnel runtime when provider credentials are configured.
