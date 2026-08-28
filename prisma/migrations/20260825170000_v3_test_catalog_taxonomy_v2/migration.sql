-- READY SCORE V3 PHASE 3.2
-- Test Catalog & Taxonomy V2
-- Establishes extensible TestType + TaxonomyVersion + TaxonomyNode ownership.
-- Preserves RIASEC F.10-C.2-F production lifecycle; only adds explicit ownership metadata.

CREATE TYPE "TestTypeCatalogStatus" AS ENUM ('CANDIDATE', 'ACTIVE', 'RETIRED');
CREATE TYPE "TaxonomyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

CREATE TABLE "TestType" ("id" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"category" TEXT NOT NULL,"status" "TestTypeCatalogStatus" NOT NULL DEFAULT 'CANDIDATE',"description" TEXT NOT NULL,"runtimeKey" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TestType_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TaxonomyVersion" ("id" TEXT NOT NULL,"testTypeId" TEXT NOT NULL,"version" TEXT NOT NULL,"status" "TaxonomyStatus" NOT NULL DEFAULT 'DRAFT',"sourceVersion" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TaxonomyVersion_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TaxonomyNode" ("id" TEXT NOT NULL,"taxonomyId" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"nodeType" TEXT NOT NULL,"level" INTEGER NOT NULL,"parentId" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TaxonomyNode_pkey" PRIMARY KEY ("id"));
ALTER TABLE "QuestionVersion" ADD COLUMN "testTypeId" TEXT, ADD COLUMN "taxonomyVersion" TEXT;
CREATE UNIQUE INDEX "TestType_code_key" ON "TestType"("code");
CREATE UNIQUE INDEX "TestType_runtimeKey_key" ON "TestType"("runtimeKey");
CREATE INDEX "TestType_status_idx" ON "TestType"("status");
CREATE INDEX "TestType_category_idx" ON "TestType"("category");
CREATE UNIQUE INDEX "TaxonomyVersion_testTypeId_version_key" ON "TaxonomyVersion"("testTypeId","version");
CREATE INDEX "TaxonomyVersion_testTypeId_status_idx" ON "TaxonomyVersion"("testTypeId","status");
CREATE UNIQUE INDEX "TaxonomyNode_taxonomyId_code_key" ON "TaxonomyNode"("taxonomyId","code");
CREATE INDEX "TaxonomyNode_taxonomyId_level_idx" ON "TaxonomyNode"("taxonomyId","level");
CREATE INDEX "TaxonomyNode_taxonomyId_parentId_idx" ON "TaxonomyNode"("taxonomyId","parentId");
CREATE INDEX "QuestionVersion_testTypeId_status_mappingStatus_idx" ON "QuestionVersion"("testTypeId","status","mappingStatus");
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-cognitive', 'COGNITIVE', 'Cognitive Ability Profile', 'ABILITY', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-eq', 'EQ', 'Emotional Profile', 'EMOTIONAL', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-aq', 'AQ', 'Adversity / Resilience Profile', 'ADVERSITY', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-disc', 'DISC', 'DISC Behavioral Profile', 'PERSONALITY', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-riasec', 'RIASEC', 'RIASEC Interest Profile', 'INTEREST', 'ACTIVE', 'Operational instrument from F.10-C.2-F.', 'RIASEC');
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-strength', 'STRENGTH', 'Strength / Preference Profile', 'STRENGTH', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TestType" ("id","code","name","category","status","description","runtimeKey") VALUES ('test-type-learning', 'LEARNING', 'Learning Profile', 'LEARNING', 'CANDIDATE', 'Candidate instrument catalog entry; construct and scoring remain to be specified in later phases.', NULL);
INSERT INTO "TaxonomyVersion" ("id","testTypeId","version","status","sourceVersion","metadata") VALUES ('taxonomy-riasec-v1','test-type-riasec','RIASEC_TAXONOMY_V1','ACTIVE','RIASEC_TAXONOMY_V1','{"architectureVersion":"V3_TEST_CATALOG_TAXONOMY_V2","preservedContent":true}');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-r','taxonomy-riasec-v1','R','Realistic','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-r-01','taxonomy-riasec-v1','R-01','Realistic','SUBDOMAIN',1,'riasec-domain-r');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-r-hands_on','taxonomy-riasec-v1','hands_on','hands_on','INDICATOR',2,'riasec-subdomain-r-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-r-tools_equipment','taxonomy-riasec-v1','tools_equipment','tools_equipment','INDICATOR',2,'riasec-subdomain-r-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-r-practical_problem_solving','taxonomy-riasec-v1','practical_problem_solving','practical_problem_solving','INDICATOR',2,'riasec-subdomain-r-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-r-physical_environment','taxonomy-riasec-v1','physical_environment','physical_environment','INDICATOR',2,'riasec-subdomain-r-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-i','taxonomy-riasec-v1','I','Investigative','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-i-01','taxonomy-riasec-v1','I-01','Investigative','SUBDOMAIN',1,'riasec-domain-i');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-i-curiosity','taxonomy-riasec-v1','curiosity','curiosity','INDICATOR',2,'riasec-subdomain-i-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-i-analysis','taxonomy-riasec-v1','analysis','analysis','INDICATOR',2,'riasec-subdomain-i-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-i-investigation','taxonomy-riasec-v1','investigation','investigation','INDICATOR',2,'riasec-subdomain-i-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-i-problem_solving','taxonomy-riasec-v1','problem_solving','problem_solving','INDICATOR',2,'riasec-subdomain-i-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-a','taxonomy-riasec-v1','A','Artistic','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-a-01','taxonomy-riasec-v1','A-01','Artistic','SUBDOMAIN',1,'riasec-domain-a');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-a-creativity','taxonomy-riasec-v1','creativity','creativity','INDICATOR',2,'riasec-subdomain-a-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-a-expression','taxonomy-riasec-v1','expression','expression','INDICATOR',2,'riasec-subdomain-a-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-a-originality','taxonomy-riasec-v1','originality','originality','INDICATOR',2,'riasec-subdomain-a-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-a-aesthetics','taxonomy-riasec-v1','aesthetics','aesthetics','INDICATOR',2,'riasec-subdomain-a-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-s','taxonomy-riasec-v1','S','Social','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-s-01','taxonomy-riasec-v1','S-01','Social','SUBDOMAIN',1,'riasec-domain-s');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-s-helping','taxonomy-riasec-v1','helping','helping','INDICATOR',2,'riasec-subdomain-s-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-s-teaching','taxonomy-riasec-v1','teaching','teaching','INDICATOR',2,'riasec-subdomain-s-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-s-communication','taxonomy-riasec-v1','communication','communication','INDICATOR',2,'riasec-subdomain-s-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-s-development','taxonomy-riasec-v1','development','development','INDICATOR',2,'riasec-subdomain-s-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-e','taxonomy-riasec-v1','E','Enterprising','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-e-01','taxonomy-riasec-v1','E-01','Enterprising','SUBDOMAIN',1,'riasec-domain-e');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-e-influence','taxonomy-riasec-v1','influence','influence','INDICATOR',2,'riasec-subdomain-e-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-e-leadership','taxonomy-riasec-v1','leadership','leadership','INDICATOR',2,'riasec-subdomain-e-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-e-initiative','taxonomy-riasec-v1','initiative','initiative','INDICATOR',2,'riasec-subdomain-e-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-e-persuasion','taxonomy-riasec-v1','persuasion','persuasion','INDICATOR',2,'riasec-subdomain-e-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level") VALUES ('riasec-domain-c','taxonomy-riasec-v1','C','Conventional','DOMAIN',0);
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-subdomain-c-01','taxonomy-riasec-v1','C-01','Conventional','SUBDOMAIN',1,'riasec-domain-c');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-c-organization','taxonomy-riasec-v1','organization','organization','INDICATOR',2,'riasec-subdomain-c-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-c-structure','taxonomy-riasec-v1','structure','structure','INDICATOR',2,'riasec-subdomain-c-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-c-information_order','taxonomy-riasec-v1','information_order','information_order','INDICATOR',2,'riasec-subdomain-c-01');
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level","parentId") VALUES ('riasec-indicator-c-accuracy','taxonomy-riasec-v1','accuracy','accuracy','INDICATOR',2,'riasec-subdomain-c-01');
ALTER TABLE "TaxonomyVersion" ADD CONSTRAINT "TaxonomyVersion_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "TestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_taxonomyId_fkey" FOREIGN KEY ("taxonomyId") REFERENCES "TaxonomyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "TestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
UPDATE "QuestionVersion" qv SET "testTypeId"='test-type-riasec', "taxonomyVersion"='RIASEC_TAXONOMY_V1' FROM "Question" q WHERE q.id=qv."questionId" AND q.code LIKE 'RIASEC-%';

