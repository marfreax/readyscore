# ReadyScore v3 — Phase 3.7 Direction Contract

**Contract:** `STUDY_DIRECTION_RESULT_V1`  
**Engine:** `STUDY_DIRECTION_ENGINE_V1`  
**Catalog:** `STUDY_DIRECTION_CATALOG_V1`

## 1. Input

The engine accepts:

```text
CrossTestProfile
StudyDirectionCatalog
Optional ContextProfile
```

It must not accept raw assessment answers as its primary input.

## 2. Output

```text
StudyDirectionResult
├── contractVersion
├── engineVersion
├── profileId
├── generatedAt
├── status
├── confidence
├── directions[]
├── synthesis
└── claims
```

## 3. Direction Item

```text
{
  directionId,
  name,
  correspondence,
  evidenceLevel,
  supportingSignals[],
  supportingPatterns[],
  potentialChallenges[],
  missingEvidence[],
  rationale[],
  explorationPrompts[]
}
```

## 4. Evidence Levels

```text
STRONG
MODERATE
LIMITED
INSUFFICIENT
```

These describe evidence strength, not probability of success.

## 5. Status

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

## 6. Non-Negotiable Invariants

```text
NO_RAW_ANSWER_ACCESS
NO_UNIVERSAL_OVERALL_SCORE
NO_RAW_SCORE_AVERAGING
NO_MAJOR_OWNERSHIP
NO_CAREER_OWNERSHIP
NO_SYNTHETIC_MISSING_EVIDENCE
NO_UNVERSIONED_RESULT
```

## 7. Explainability

Every direction returned with non-insufficient evidence must contain at least one rationale item and preserve the source signal identity.

## 8. Provenance

The result must retain:

```text
profileId
profileContractVersion
profileEngineVersion
studyDirectionCatalogVersion
studyDirectionEngineVersion
generatedAt
```

## 9. Claims

Allowed:

```text
Strong alignment
Potential alignment
Worth exploring
Area to validate
Potential challenge
Suggested exploration
```

Prohibited:

```text
guaranteed suitability
guaranteed success
major determination
career determination
admission prediction
graduation prediction
```

# END
