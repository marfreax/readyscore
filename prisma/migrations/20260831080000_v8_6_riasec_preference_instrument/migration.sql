-- V8.6 RIASEC Instrument: additive taxonomy boundary; historical V1 remains immutable.
DO $$
DECLARE test_type_id TEXT; old_id TEXT;
BEGIN
 SELECT "id" INTO test_type_id FROM "TestType" WHERE "code"='RIASEC';
 IF test_type_id IS NULL THEN RAISE EXCEPTION 'TEST_TYPE_NOT_FOUND:RIASEC'; END IF;
 SELECT "id" INTO old_id FROM "TaxonomyVersion" WHERE "testTypeId"=test_type_id AND "version"='RIASEC_TAXONOMY_V1';
 IF old_id IS NOT NULL THEN UPDATE "TaxonomyVersion" SET "status"='RETIRED',"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=old_id AND "status"='ACTIVE'; END IF;
 INSERT INTO "TaxonomyVersion" ("id","testTypeId","version","status","sourceVersion","metadata","createdAt","updatedAt")
 VALUES ('taxonomy-riasec-v2',test_type_id,'RIASEC_TAXONOMY_V2','ACTIVE','V8.6',
 '{"instrument":"RIASEC","responseModel":"preference","questionType":"LIKERT_5_PREFERENCE","scoringVersion":"RIASEC_SCORE_V2","dimensions":["R","I","A","S","E","C"],"itemsPerDimension":10}'::jsonb,
 CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
 ON CONFLICT ("testTypeId","version") DO UPDATE SET "status"='ACTIVE',"sourceVersion"='V8.6',"metadata"=EXCLUDED."metadata","updatedAt"=CURRENT_TIMESTAMP;
END $$;
