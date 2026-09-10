-- READY SCORE V8.3
-- Cognitive Instrument: objective answer choices and keyed option metadata.
--
-- Additive only:
--   * adds optional objective metadata columns
--   * establishes the V8.3 Cognitive taxonomy boundary
--   * retires the prior Cognitive taxonomy as an active selection source
-- No historical QuestionVersion rows are rewritten.

ALTER TABLE "QuestionVersion" ADD COLUMN "options" JSONB;
ALTER TABLE "QuestionVersion" ADD COLUMN "correctOption" INTEGER;

ALTER TABLE "QuestionVersion"
  ADD CONSTRAINT "QuestionVersion_correctOption_range"
  CHECK ("correctOption" IS NULL OR ("correctOption" >= 1 AND "correctOption" <= 4));

INSERT INTO "TaxonomyVersion"
  ("id","testTypeId","version","status","sourceVersion","metadata")
VALUES
  (
    'taxonomy-cognitive-v2',
    'test-type-cognitive',
    'COGNITIVE_TAXONOMY_V2',
    'ACTIVE',
    'V8_3_COGNITIVE_INSTRUMENT',
    '{"architectureVersion":"V8.3","instrumentStatus":"OBJECTIVE","claimStatus":"cognitive_reasoning_score_only"}'
  )
ON CONFLICT ("testTypeId","version") DO NOTHING;

UPDATE "TaxonomyVersion"
SET "status"='RETIRED'
WHERE "testTypeId"='test-type-cognitive'
  AND "version"='COGNITIVE_TAXONOMY_V1';

INSERT INTO "TaxonomyNode"
  ("id","taxonomyId","code","name","nodeType","level")
VALUES
  ('cognitive-v2-domain-verbal-reasoning','taxonomy-cognitive-v2','VERBAL_REASONING','Verbal Reasoning','DOMAIN',0),
  ('cognitive-v2-domain-numerical-reasoning','taxonomy-cognitive-v2','NUMERICAL_REASONING','Numerical Reasoning','DOMAIN',0),
  ('cognitive-v2-domain-logical-reasoning','taxonomy-cognitive-v2','LOGICAL_REASONING','Logical Reasoning','DOMAIN',0),
  ('cognitive-v2-domain-abstract-reasoning','taxonomy-cognitive-v2','ABSTRACT_REASONING','Abstract Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;
