-- V8.5 DISC Instrument
-- Additive data-only migration: establish DISC V2 taxonomy boundary.
-- Historical DISC V1 question versions remain immutable and continue to
-- reference DISC_TAXONOMY_V1.

DO $$
DECLARE
  disc_test_type_id TEXT;
  old_taxonomy_id TEXT;
BEGIN
  SELECT "id" INTO disc_test_type_id FROM "TestType" WHERE "code" = 'DISC';
  IF disc_test_type_id IS NULL THEN
    RAISE EXCEPTION 'TEST_TYPE_NOT_FOUND:DISC';
  END IF;

  SELECT "id" INTO old_taxonomy_id
  FROM "TaxonomyVersion"
  WHERE "testTypeId" = disc_test_type_id AND "version" = 'DISC_TAXONOMY_V1';

  IF old_taxonomy_id IS NOT NULL THEN
    UPDATE "TaxonomyVersion"
    SET "status" = 'RETIRED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = old_taxonomy_id AND "status" = 'ACTIVE';
  END IF;

  INSERT INTO "TaxonomyVersion"
    ("id","testTypeId","version","status","sourceVersion","metadata","createdAt","updatedAt")
  VALUES
    ('taxonomy-disc-v2',disc_test_type_id,'DISC_TAXONOMY_V2','ACTIVE','V8.5',
     '{"instrument":"DISC","responseModel":"situational_forced_choice","questionType":"SCENARIO_SINGLE_CHOICE","scoringVersion":"DISC_SCORE_V2","positionMapping":"ITEM_SPECIFIC"}'::jsonb,
     CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  ON CONFLICT ("testTypeId","version") DO UPDATE
    SET "status" = 'ACTIVE',
        "sourceVersion" = 'V8.5',
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP;
END $$;
