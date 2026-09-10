-- V8.4 EQ Instrument
-- Additive data-only migration: establish EQ V2 taxonomy boundary.
-- Historical EQ V1 question versions remain immutable and continue to reference EQ_TAXONOMY_V1.

DO $$
DECLARE
  eq_test_type_id TEXT;
  old_taxonomy_id TEXT;
BEGIN
  SELECT "id" INTO eq_test_type_id FROM "TestType" WHERE "code" = 'EQ';
  IF eq_test_type_id IS NULL THEN
    RAISE EXCEPTION 'TEST_TYPE_NOT_FOUND:EQ';
  END IF;

  SELECT "id" INTO old_taxonomy_id
  FROM "TaxonomyVersion"
  WHERE "testTypeId" = eq_test_type_id AND "version" = 'EQ_TAXONOMY_V1';

  IF old_taxonomy_id IS NOT NULL THEN
    UPDATE "TaxonomyVersion"
    SET "status" = 'RETIRED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = old_taxonomy_id AND "status" = 'ACTIVE';
  END IF;

  INSERT INTO "TaxonomyVersion"
    ("id","testTypeId","version","status","sourceVersion","metadata","createdAt","updatedAt")
  VALUES
    ('taxonomy-eq-v2',eq_test_type_id,'EQ_TAXONOMY_V2','ACTIVE','V8.4',
     '{"instrument":"EQ","responseModel":"situational_judgment","questionType":"SCENARIO_SINGLE_CHOICE","scoringVersion":"EQ_SCORE_V2"}'::jsonb,
     CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  ON CONFLICT ("testTypeId","version") DO UPDATE
    SET "status" = 'ACTIVE',
        "sourceVersion" = 'V8.4',
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP;
END $$;
