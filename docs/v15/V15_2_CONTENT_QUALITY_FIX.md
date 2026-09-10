# ReadyScore V15.2 — Content Quality Fix

## Root cause
The V15.2 content-quality gate correctly detected an awkward sentence join in the major-matching engine.

The previous construction concatenated a complete sentence ending in `.` with a caution template beginning with `perlu`, producing copy such as:

`Ada beberapa sinyal yang mendukung dan layak divalidasi melalui eksplorasi. perlu kesiapan ...`

The defect was in the sentence composition of `whyItFits`, not in scoring, ranking, evidence calculation, entitlement, or report pagination.

## Fix
`lib/v15/major-matching/engine-v1.ts` now joins the two sentence parts safely:

- when the second clause begins with `perlu`, it is joined with `; `;
- otherwise the second clause is capitalized before joining;
- terminal punctuation is normalized.

This preserves the existing matching/scoring logic and changes only customer-facing copy composition.

## Validation
- All 8 caution templates were checked against the exact gate regex.
- No `. perlu` fragment boundary remains in the generated join form.
- No scoring weights, recommendation selection, evidence coverage, entitlement logic, or page-count logic were changed.
