# ReadyScore V8.1 — Measurement Specification Lock

**Status:** LOCKED DEVELOPMENT SPECIFICATION  
**Baseline:** V8.0 Assessment Instrument Audit PASS  
**Implementation status:** Specification only; production measurement/scoring is NOT changed in V8.1  
**Purpose:** Convert the V8.0 audit direction into an explicit measurement contract for V8.2–V8.8.

---

## 1. Lock Principle

V8.1 locks the intended measurement model before question-bank and scoring implementation.

The chain is:

```text
CONSTRUCT
→ INTENDED USE
→ ITEM BLUEPRINT
→ QUESTION TYPE
→ RESPONSE MODEL
→ ITEM SCORING
→ DIMENSION AGGREGATION
→ OVERALL / PROFILE
→ CLASSIFICATION
→ INTERPRETATION
→ CUSTOMER TERMINOLOGY
```

V8.1 does **not** modify existing production scoring code, question content, database schema, or historical results.

Any implementation that materially differs from this specification requires a documented change decision and a new gate.

---

# 2. Global Rules

## 2.1 Assessment-specific measurement

The four assessments MUST NOT be forced into one response/scoring model.

```text
Cognitive → objective performance
EQ        → scenario-based emotional/social judgment
DISC      → behavioral forced-choice profile
RIASEC    → interest/preference
```

## 2.2 No universal score

There is no single cross-test score combining Cognitive, EQ, DISC, and RIASEC.

Cross-test Profile may visualize domains, but unrelated raw scores MUST NOT be averaged.

## 2.3 Historical integrity

A new instrument or scoring rule is a new version.

Historical attempts must retain the question/scoring version used at the time of completion.

## 2.4 Customer claims

The product must only claim what the instrument actually measures.

In particular:

- Cognitive is a **Cognitive Reasoning Score**, not an IQ score.
- EQ is an **Emotional Intelligence profile/score** under the defined instrument model, not a clinical diagnosis.
- DISC is a **behavioral style/profile**, not a deterministic personality diagnosis.
- RIASEC is an **interest profile**, not a guarantee of career fit.

---

# 3. Cognitive / IQ — LOCKED SPECIFICATION

## 3.1 Construct

**Primary construct:** cognitive reasoning performance.

The assessment measures performance on structured reasoning tasks rather than agreement with statements about the user's self-perception.

## 3.2 Intended use

The result may describe relative performance across the defined reasoning domains.

It MUST NOT make an IQ/clinical/cognitive-diagnosis claim unless a future separately approved norming and validation program supports that claim.

## 3.3 Domains

The four locked domains are:

1. Verbal Reasoning
2. Numerical Reasoning
3. Logical Reasoning
4. Abstract Reasoning

## 3.4 Item blueprint

Target:

- 24 scored items
- 6 items per domain
- balanced domain coverage
- objective keyed response

Difficulty distribution must be deliberately designed in V8.3 and documented; difficulty MUST NOT be inferred from presentation order.

## 3.5 Question model

Primary question type:

```text
SINGLE_CHOICE
```

Supported stimulus families may include:

- text/verbal reasoning
- numerical reasoning
- logical relationships
- pattern/abstract reasoning

A question must have an objectively keyed answer.

## 3.6 Response model

```text
stimulus/problem
→ multiple choices
→ one selected answer
→ keyed correct/incorrect
```

No Likert agreement response is used for the new Cognitive instrument.

## 3.7 Item scoring

For the locked baseline model:

- correct = 1
- incorrect = 0
- no response = unscored

No subjective partial credit is introduced unless separately approved.

## 3.8 Dimension score

For each domain:

```text
correct answers / answered scored items
→ 0–100
```

A dimension with insufficient answered items must not be presented as a reliable score; the exact completion threshold is to be implemented and tested in V8.3.

## 3.9 Overall score

The overall Cognitive Score is the arithmetic mean of the four domain scores **when all four domains meet the completion threshold**.

It is a product score, not an IQ score.

## 3.10 Classification

V8.1 does not authorize psychometric percentile, norm group, IQ bands, or diagnostic classifications.

V8.3 must define only defensible product-level performance bands if needed.

## 3.11 Customer terminology

Preferred:

- Cognitive Assessment
- Cognitive Reasoning Score
- Reasoning Dimensions

Forbidden unless separately validated:

- IQ
- IQ equivalent
- intelligence quotient
- clinical cognitive diagnosis

---

# 4. EQ — LOCKED SPECIFICATION

## 4.1 Construct

**Primary construct:** emotional and social response capability as operationalized by the ReadyScore EQ instrument.

The instrument is not a clinical diagnostic instrument.

## 4.2 Intended use

The result describes patterns in emotional/social functioning represented by the four defined dimensions.

## 4.3 Dimensions

1. Emotion Awareness
2. Emotion Regulation
3. Empathy & Social Awareness
4. Relationship & Social Response

## 4.4 Item blueprint

Target:

- 24 scored items
- 6 items per primary dimension
- scenario-based coverage
- balanced dimension coverage

## 4.5 Question model

Primary question type:

```text
SCENARIO + SINGLE_CHOICE
```

Example structure:

```text
Situation
→ realistic response options
→ user selects the response most representative of what they would do
```

Options should represent meaningfully different emotional/social responses and must not expose the intended dimension labels.

## 4.6 Response model

The primary V8 EQ model is **situational judgment**, not generic agree/disagree.

A separate self-report component is not added in V8.1 because mixing self-perception and demonstrated judgment would require an explicit weighting and validation model.

## 4.7 Item scoring

Each scenario has a documented keyed scoring map.

The implementation target is an ordinal item score representing the relative quality of the selected response. The exact key values and validation rubric must be frozen in V8.2/V8.4 before production content is activated.

No ad-hoc weighting is permitted.

## 4.8 Dimension score

Each dimension is aggregated from its six designated scored scenarios and normalized to a 0–100 product score.

## 4.9 Overall score

Overall EQ score is the arithmetic mean of the four dimension scores when completion requirements are satisfied.

## 4.10 Classification

No clinical diagnosis, mental-health diagnosis, or definitive trait label.

Product-level descriptive bands may be introduced only with an explicit interpretation mapping.

## 4.11 Customer terminology

Preferred:

- Emotional Intelligence Assessment
- EQ Score
- Emotional & Social Dimensions

Avoid claims such as:

- clinical emotional diagnosis
- definitive emotional ability
- guaranteed interpersonal success

---

# 5. DISC — LOCKED SPECIFICATION

## 5.1 Construct

**Primary construct:** behavioral style/tendency profile across D/I/S/C.

DISC is not an ability test with objectively correct answers.

## 5.2 Intended use

The result describes behavioral preferences/tendencies and the relative prominence of D, I, S, and C patterns.

## 5.3 Dimensions

- D — Dominance
- I — Influence
- S — Steadiness
- C — Conscientiousness

## 5.4 Item blueprint

Target:

- 24 forced-choice scenarios
- 4 response options per item
- each item presents one plausible D, I, S, and C behavioral response
- dimension representation is balanced across the full bank
- option positions are varied

The statement "A = D, B = I, C = S, D = C" MUST NOT become a global positional rule.

## 5.5 Question model

Primary:

```text
SCENARIO + FORCED_CHOICE
```

Example:

```text
Situation
A. Take charge and organize the situation
B. Make the atmosphere more positive
C. Calm the people involved
D. Analyze what happened and what should happen next
```

The customer sees the scenario and responses, not the hidden D/I/S/C labels.

## 5.6 Response model

One option is selected as the response that most represents the participant.

A "least like me" second choice is not required by V8.1.

## 5.7 Item scoring

Each selected option contributes to the hidden dimension represented by that option.

Scoring is based on response counts across the completed instrument.

Option-to-dimension mapping must be explicit per item and may be randomized/varied by item.

## 5.8 Dimension score

Each dimension score is derived from the proportion of selections assigned to that dimension and normalized to a 0–100 profile scale.

The four dimension scores are profile values, not independent ability scores.

## 5.9 Primary and secondary pattern

Primary = highest dimension score.

Secondary = second-highest dimension score.

Tie handling must be deterministic and documented before implementation.

## 5.10 Customer terminology

Preferred:

- DISC Profile
- Behavioral Style
- D / I / S / C Profile

Avoid deterministic statements such as "you are always..." or guaranteed career/personality claims.

---

# 6. RIASEC — LOCKED SPECIFICATION

## 6.1 Construct

**Primary construct:** vocational interest/preference.

RIASEC does not measure cognitive ability or behavioral performance.

## 6.2 Intended use

The result supports interest exploration and career exploration.

It MUST NOT claim that a specific occupation is guaranteed to fit the user.

## 6.3 Dimensions

- R — Realistic
- I — Investigative
- A — Artistic
- S — Social
- E — Enterprising
- C — Conventional

## 6.4 Item blueprint

The established V7 production baseline is retained:

- 60 scored items
- 10 items per dimension
- balanced coverage

This is a KEEP direction from V8.0, subject to content refinement.

## 6.5 Question model

Primary:

```text
LIKERT_5_PREFERENCE
```

Items express attraction/interest in activities, environments, or tasks.

## 6.6 Response model

Example:

```text
How interested are you in doing this activity?
1 → Not interested
...
5 → Very interested
```

Items must not primarily ask whether the participant is capable, intelligent, or personally virtuous.

## 6.7 Item scoring

Responses are scored on the 1–5 preference scale, with reverse scoring only where explicitly justified.

## 6.8 Dimension score

For each RIASEC dimension:

```text
weighted preference mean
→ normalized 0–100
```

The existing six-dimension coverage and quality controls remain required.

## 6.9 Top Code

When completion/coverage requirements are satisfied:

```text
six dimension scores
→ deterministic ranking
→ top 3 dimensions
→ three-letter Top Code
```

Tie handling must remain deterministic.

## 6.10 Customer terminology

Preferred:

- Interest Profile
- RIASEC Profile
- Interest Dimensions
- Top Code

Avoid:

- "the career you should choose"
- guaranteed job fit
- ability claims based on interest scores

---

# 7. Comparative Measurement Contract

| Assessment | Construct | Primary response | Result |
|---|---|---|---|
| Cognitive | Cognitive reasoning performance | Objective single-choice | Overall + 4 reasoning dimensions |
| EQ | Emotional/social judgment | Scenario single-choice | Overall + 4 EQ dimensions |
| DISC | Behavioral style | Forced-choice scenario | D/I/S/C profile + primary/secondary |
| RIASEC | Vocational interest | Likert-5 preference | 6 interest dimensions + Top Code |

---

# 8. Scoring Architecture Contract

All four instruments follow the same architectural pipeline but different semantics:

```text
USER RESPONSE
    ↓
ITEM VALIDATION
    ↓
ITEM SCORING
    ↓
DIMENSION AGGREGATION
    ↓
OVERALL / PROFILE RULE
    ↓
CLASSIFICATION
    ↓
INTERPRETATION
```

The implementation MUST NOT collapse these into a universal scoring function.

---

# 9. Versioning Contract

V8.1 is a specification lock.

**V8.1 is specification-only.**

Implementation phases must introduce explicit versions:

```text
V8.1
Measurement Specification

V8.2
Question & Scoring Architecture

V8.3
Cognitive Instrument

V8.4
EQ Instrument

V8.5
DISC Instrument

V8.6
RIASEC Instrument
```

Production scoring version identifiers must change only when the scoring semantics actually change.

Historical attempts must remain bound to their original version.

---

# 10. Required V8.2 Decisions

V8.2 must turn this specification into an executable question/scoring architecture.

It must define:

- question type schema
- option schema
- correct-answer/key schema
- dimension mapping
- scoring-key metadata
- reverse-key metadata where applicable
- forced-choice mapping
- scenario scoring representation
- completion rules
- tie handling
- version identity
- immutable historical question versions

V8.2 MUST NOT invent a different measurement construct.

---

# 11. Explicit Non-Goals

V8.1 does NOT:

- replace production question banks
- modify scoring functions
- alter database schema
- change existing historical results
- add IQ norming
- introduce clinical diagnosis
- create a universal score
- implement radar/profile UI
- change customer UI
- activate new assessment content

---

# 12. Acceptance Criteria

V8.1 is complete when:

- all four constructs are explicit;
- intended use and limitations are explicit;
- response models are explicit;
- question types are explicit;
- scoring direction is explicit;
- result semantics are explicit;
- customer terminology is explicit;
- no universal score exists;
- versioning rules are explicit;
- V8.2 can implement the specification without guessing the measurement intent.

**V8.1 STATUS: LOCKED**
