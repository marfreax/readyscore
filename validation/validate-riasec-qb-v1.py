import csv, sys
from collections import Counter, defaultdict
from pathlib import Path

TARGET = {"TARGET": 60, "RESERVE": 24}
DIMENSIONS = ["R","I","A","S","E","C"]
EXPECTED = {d: {"TARGET":10, "RESERVE":4} for d in DIMENSIONS}

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("csv/RIASEC_QB_V1_FULL_84_CANDIDATE.csv")
rows = list(csv.DictReader(path.open(encoding="utf-8-sig")))

errors = []
if len(rows) != 84:
    errors.append(f"expected 84 rows, got {len(rows)}")

ids = [r["id"] for r in rows]
if len(ids) != len(set(ids)):
    errors.append("duplicate IDs")

texts = [r["text"].strip().lower() for r in rows]
if len(texts) != len(set(texts)):
    errors.append("duplicate exact question text")

counts = defaultdict(Counter)
for r in rows:
    d, role = r["domain"], r["role"]
    if d not in DIMENSIONS:
        errors.append(f"invalid dimension: {d}")
    if role not in TARGET:
        errors.append(f"invalid role: {role}")
    counts[d][role] += 1

for d in DIMENSIONS:
    for role in TARGET:
        actual = counts[d][role]
        expected = EXPECTED[d][role]
        if actual != expected:
            errors.append(f"{d}/{role}: expected {expected}, got {actual}")

for r in rows:
    if r["reverseScore"].lower() != "false":
        errors.append(f"{r['id']}: reverseScore must be false in V1 candidate")
    if r["weight"] != "1":
        errors.append(f"{r['id']}: weight must be 1")
    if r["scale"] != "1|2|3|4|5":
        errors.append(f"{r['id']}: invalid scale")
    if r["scoringKey"] != "1|2|3|4|5":
        errors.append(f"{r['id']}: invalid scoringKey")
    if not r["text"].strip():
        errors.append(f"{r['id']}: empty text")
    if not r["subdomain"].strip() or not r["indicator"].strip():
        errors.append(f"{r['id']}: missing mapping metadata")

if errors:
    print("RIASEC_QB_V1 VALIDATION: FAIL")
    for e in errors:
        print("-", e)
    sys.exit(1)

print("RIASEC_QB_V1 VALIDATION: PASS")
print("Target:", sum(1 for r in rows if r["role"]=="TARGET"))
print("Reserve:", sum(1 for r in rows if r["role"]=="RESERVE"))
for d in DIMENSIONS:
    print(d, "target=", counts[d]["TARGET"], "reserve=", counts[d]["RESERVE"])
