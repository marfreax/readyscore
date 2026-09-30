-- ReadyScore V18.3 — Runtime Data Reconciliation
--
-- Purpose:
--   Activate the already-existing V2 production packages through new
--   AssessmentConfigurationVersion rows without mutating historical
--   configuration/version identities used by prior attempts.
--
-- Safety:
--   - No Question or QuestionVersion rows are created/updated/deleted.
--   - No AssessmentAttempt / AssessmentResult / AttemptQuestion rows are changed.
--   - Existing V2 packages remain untouched.
--   - Legacy configuration versions are retained and archived.
--   - FREE gets only a package definition over the existing RIASEC V2 pool.

-- FREE requires a distinct 10-question package because runtime validation
-- requires configuration.questionCount == package.totalQuestions.
INSERT INTO "QuestionPackage"
  ("id", "testTypeId", "code", "name", "description")
VALUES
  (
    'free-runtime-package',
    'test-type-riasec',
    'free-runtime',
    'FREE Internal Runtime Package',
    'Internal runtime package for FREE assessment. Uses the existing RIASEC V2 question pool.'
  )
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "QuestionPackageVersion"
  ("id", "packageId", "version", "totalQuestions", "timeLimitSeconds", "taxonomyVersionId", "status", "metadata")
VALUES
  (
    'free-runtime-v1-package-version',
    'free-runtime-package',
    'v1',
    10,
    0,
    'taxonomy-riasec-v2',
    'PUBLISHED',
    jsonb_build_object(
      'internalRuntime', true,
      'configurationVersionId', 'free-runtime-v1-version',
      'questionBankVersion', 'QB_RUNTIME',
      'selectionScope', 'RIASEC_FREE',
      'runtimeAssessmentType', 'FREE',
      'packageCode', 'free-runtime',
      'packageVersion', 'v1',
      'taxonomyVersion', 'RIASEC_TAXONOMY_V2',
      'totalQuestions', 10,
      'timeLimitSeconds', 0,
      'historicalAttemptsImmutable', true
    )
  )
ON CONFLICT ("packageId", "version") DO UPDATE
SET
  "totalQuestions" = EXCLUDED."totalQuestions",
  "timeLimitSeconds" = EXCLUDED."timeLimitSeconds",
  "taxonomyVersionId" = EXCLUDED."taxonomyVersionId",
  "status" = EXCLUDED."status",
  "metadata" = EXCLUDED."metadata";

-- FREE composition: R2 I2 A2 S2 E1 C1.
INSERT INTO "QuestionPackageCompositionRule"
  ("id", "packageVersionId", "taxonomyNodeId", "requiredCount")
VALUES
  ('free-runtime-rule-r', 'free-runtime-v1-package-version', 'riasec-v2-domain-r', 2),
  ('free-runtime-rule-i', 'free-runtime-v1-package-version', 'riasec-v2-domain-i', 2),
  ('free-runtime-rule-a', 'free-runtime-v1-package-version', 'riasec-v2-domain-a', 2),
  ('free-runtime-rule-s', 'free-runtime-v1-package-version', 'riasec-v2-domain-s', 2),
  ('free-runtime-rule-e', 'free-runtime-v1-package-version', 'riasec-v2-domain-e', 1),
  ('free-runtime-rule-c', 'free-runtime-v1-package-version', 'riasec-v2-domain-c', 1)
ON CONFLICT ("packageVersionId", "taxonomyNodeId") DO UPDATE
SET "requiredCount" = EXCLUDED."requiredCount";

-- Create the new canonical runtime configuration versions while preserving
-- the legacy version rows for historical attempts and auditability.
INSERT INTO "AssessmentConfigurationVersion"
  ("id", "configurationId", "version", "questionBankVersion", "taxonomyVersion", "scoringVersion", "selectionAlgorithmVersion", "questionCount", "status", "metadata", "questionPackageVersionId")
VALUES
  (
    'free-runtime-v1-version',
    'free-v1',
    'FREE_RUNTIME_V1',
    'QB_RUNTIME',
    'RIASEC_TAXONOMY_V2',
    'RIASEC_FREE_SCORE_V1',
    'RIASEC_FREE_SELECTION_V1',
    10,
    'ACTIVE',
    jsonb_build_object(
      'questionGroup', 'RIASEC',
      'composition', jsonb_build_array(
        jsonb_build_object('code','R','requiredCount',2),
        jsonb_build_object('code','I','requiredCount',2),
        jsonb_build_object('code','A','requiredCount',2),
        jsonb_build_object('code','S','requiredCount',2),
        jsonb_build_object('code','E','requiredCount',1),
        jsonb_build_object('code','C','requiredCount',1)
      ),
      'selectionConstraints', jsonb_build_object('requiredCount',10),
      'runtimeAuthority', 'DATABASE',
      'runtimePackageInternal', true,
      'selectionScope', 'RIASEC_FREE',
      'governance', jsonb_build_object('historicalAttemptsImmutable',true,'activationRequiresReadiness',true)
    ),
    'free-runtime-v1-package-version'
  ),
  (
    'riasec-v2-runtime-version',
    'riasec-v1',
    'RIASEC_CONFIG_V2',
    'QB_RUNTIME',
    'RIASEC_TAXONOMY_V2',
    'RIASEC_SCORE_V2',
    'RIASEC_SELECTION_V2',
    60,
    'ACTIVE',
    jsonb_build_object(
      'questionGroup','RIASEC',
      'composition',jsonb_build_array(
        jsonb_build_object('code','R','requiredCount',10),
        jsonb_build_object('code','I','requiredCount',10),
        jsonb_build_object('code','A','requiredCount',10),
        jsonb_build_object('code','S','requiredCount',10),
        jsonb_build_object('code','E','requiredCount',10),
        jsonb_build_object('code','C','requiredCount',10)
      ),
      'selectionConstraints',jsonb_build_object('requiredCount',60),
      'runtimeAuthority','DATABASE',
      'runtimePackageInternal',true,
      'governance',jsonb_build_object('historicalAttemptsImmutable',true,'activationRequiresReadiness',true)
    ),
    'cmtxycq540138tb9gfhhostc8'
  ),
  (
    'disc-v2-runtime-version',
    'disc-v1',
    'DISC_CONFIG_V2',
    'QB_RUNTIME',
    'DISC_TAXONOMY_V2',
    'DISC_SCORE_V2',
    'DISC_SELECTION_V2',
    80,
    'ACTIVE',
    jsonb_build_object(
      'questionGroup','DISC',
      'composition',jsonb_build_array(
        jsonb_build_object('code','TARGET_D','requiredCount',20),
        jsonb_build_object('code','TARGET_I','requiredCount',20),
        jsonb_build_object('code','TARGET_S','requiredCount',20),
        jsonb_build_object('code','TARGET_C','requiredCount',20)
      ),
      'selectionConstraints',jsonb_build_object('requiredCount',80),
      'runtimeAuthority','DATABASE',
      'runtimePackageInternal',true,
      'governance',jsonb_build_object('historicalAttemptsImmutable',true,'activationRequiresReadiness',true)
    ),
    'cmtxypdmt02igtb9g4u3vvkzq'
  ),
  (
    'eq-v2-runtime-version',
    'eq-v1',
    'EQ_CONFIG_V2',
    'QB_RUNTIME',
    'EQ_TAXONOMY_V2',
    'EQ_SCORE_V2',
    'EQ_SELECTION_V2',
    50,
    'ACTIVE',
    jsonb_build_object(
      'questionGroup','EQ',
      'composition',jsonb_build_array(
        jsonb_build_object('code','EMOTION_AWARENESS','requiredCount',13),
        jsonb_build_object('code','EMOTION_REGULATION','requiredCount',13),
        jsonb_build_object('code','EMPATHY_SOCIAL_AWARENESS','requiredCount',12),
        jsonb_build_object('code','RELATIONSHIP_SOCIAL_RESPONSE','requiredCount',12)
      ),
      'selectionConstraints',jsonb_build_object('requiredCount',50),
      'runtimeAuthority','DATABASE',
      'runtimePackageInternal',true,
      'governance',jsonb_build_object('historicalAttemptsImmutable',true,'activationRequiresReadiness',true)
    ),
    'cmtxyi73b01n1tb9got8a8sdo'
  ),
  (
    'cognitive-v2-runtime-version',
    'cognitive-v1',
    'COGNITIVE_CONFIG_V2',
    'QB_RUNTIME',
    'COGNITIVE_TAXONOMY_V2',
    'COGNITIVE_SCORE_V2',
    'COGNITIVE_SELECTION_V2',
    40,
    'ACTIVE',
    jsonb_build_object(
      'questionGroup','IQ_COGNITIVE',
      'composition',jsonb_build_array(
        jsonb_build_object('code','VERBAL_REASONING','requiredCount',10),
        jsonb_build_object('code','NUMERICAL_REASONING','requiredCount',10),
        jsonb_build_object('code','LOGICAL_REASONING','requiredCount',10),
        jsonb_build_object('code','ABSTRACT_REASONING','requiredCount',10)
      ),
      'selectionConstraints',jsonb_build_object('requiredCount',40),
      'runtimeAuthority','DATABASE',
      'runtimePackageInternal',true,
      'governance',jsonb_build_object('historicalAttemptsImmutable',true,'activationRequiresReadiness',true)
    ),
    'cmtxcoj7g0001tb9gillsn5py'
  )
ON CONFLICT ("configurationId", "version") DO UPDATE
SET
  "questionBankVersion" = EXCLUDED."questionBankVersion",
  "taxonomyVersion" = EXCLUDED."taxonomyVersion",
  "scoringVersion" = EXCLUDED."scoringVersion",
  "selectionAlgorithmVersion" = EXCLUDED."selectionAlgorithmVersion",
  "questionCount" = EXCLUDED."questionCount",
  "status" = EXCLUDED."status",
  "metadata" = EXCLUDED."metadata",
  "questionPackageVersionId" = EXCLUDED."questionPackageVersionId";

-- Only one canonical runtime version is ACTIVE per operational configuration.
UPDATE "AssessmentConfigurationVersion" acv
SET "status" = 'ARCHIVED'
FROM "AssessmentConfiguration" ac
WHERE ac.id = acv."configurationId"
  AND ac.code IN ('free-v1','riasec-v1','disc-v1','eq-v1','cognitive-v1')
  AND acv.status = 'ACTIVE'
  AND acv.id NOT IN (
    'free-runtime-v1-version',
    'riasec-v2-runtime-version',
    'disc-v2-runtime-version',
    'eq-v2-runtime-version',
    'cognitive-v2-runtime-version'
  );

UPDATE "AssessmentConfigurationVersion"
SET "status" = 'ACTIVE'
WHERE id IN (
  'free-runtime-v1-version',
  'riasec-v2-runtime-version',
  'disc-v2-runtime-version',
  'eq-v2-runtime-version',
  'cognitive-v2-runtime-version'
);
