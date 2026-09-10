# V11.7.11 Four-Group Regression Fixtures

These CSV fixtures are test-only regression assets for the four Question Groups.
They are intentionally namespaced with `V11_7_11_` IDs so they can be imported into a test database without colliding with existing production/sample IDs.

Files:
- `disc-question-bank-sample-100.csv` — 100 DISC rows
- `riasec-question-bank-sample-100.csv` — 100 RIASEC rows
- `iq_cognitive-question-bank-sample-100.csv` — 100 Cognitive rows
- `eq-question-bank-sample-100.csv` — 100 EQ rows

Fixture invariants:
- exactly 100 data rows per file
- unique logical IDs within each file
- unique IDs across all four files
- complete domain/subdomain/indicator mapping
- DISC: 4 options + 4-value forced-choice scoring key
- RIASEC: 5-point scale + 5-value scoring key
- Cognitive/EQ: 4 options + integer correct option + one-value scoring key
- no status column is supplied; server/parser owns the DRAFT invariant
- fixtures do not mutate the database merely by being present

These assets implement the V11.7.11 regression-fixture requirement and are not production Question Bank content.
