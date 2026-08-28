ALTER TYPE "AssessmentType" ADD VALUE IF NOT EXISTS 'DISC';

-- READY SCORE V4 L4
-- DISC MVP
-- Customer-facing behavioral/personality assessment MVP.
-- Internal MVP content; successful runtime is not psychometric validation.
-- All Question and QuestionVersion rows use explicit deterministic IDs and timestamps so the migration matches the existing NOT NULL schema.
UPDATE "TestType"
SET "status"='ACTIVE', "runtimeKey"='DISC', "description"='Customer-facing DISC behavioral/personality MVP from V4 L4.'
WHERE "code"='DISC';

INSERT INTO "TaxonomyVersion" ("id","testTypeId","version","status","sourceVersion","metadata")
VALUES ('taxonomy-disc-v1','test-type-disc','DISC_TAXONOMY_V1','ACTIVE','DISC_TAXONOMY_V1','{"architectureVersion":"V4_L4_DISC_MVP","instrumentStatus":"MVP"}')
ON CONFLICT ("testTypeId","version") DO NOTHING;

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES
('disc-domain-d','taxonomy-disc-v1','D','Dominance','DOMAIN',0),
('disc-domain-i','taxonomy-disc-v1','I','Influence','DOMAIN',0),
('disc-domain-s','taxonomy-disc-v1','S','Steadiness','DOMAIN',0),
('disc-domain-c','taxonomy-disc-v1','C','Conscientiousness','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-001','DISC-D-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-001','DISC-D-001','test-type-disc','DISC_TAXONOMY_V1','v1','Mengambil keputusan dengan cepat ketika hasil perlu segera dicapai.','D','D_BEHAVIOR','D_001','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-002','DISC-D-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-002','DISC-D-002','test-type-disc','DISC_TAXONOMY_V1','v1','Saya nyaman memimpin arah tindakan ketika situasi belum jelas.','D','D_BEHAVIOR','D_002','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-003','DISC-D-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-003','DISC-D-003','test-type-disc','DISC_TAXONOMY_V1','v1','Saya terdorong untuk menghadapi tantangan yang sulit.','D','D_BEHAVIOR','D_003','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-004','DISC-D-004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-004','DISC-D-004','test-type-disc','DISC_TAXONOMY_V1','v1','Saya cenderung menyampaikan pendapat secara langsung dan tegas.','D','D_BEHAVIOR','D_004','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-005','DISC-D-005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-005','DISC-D-005','test-type-disc','DISC_TAXONOMY_V1','v1','Saya menikmati situasi yang memberi saya ruang untuk mengambil kendali.','D','D_BEHAVIOR','D_005','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-D-006','DISC-D-006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-d-006','DISC-D-006','test-type-disc','DISC_TAXONOMY_V1','v1','Ketika ada hambatan, saya fokus mencari cara agar tujuan tetap tercapai.','D','D_BEHAVIOR','D_006','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-007','DISC-I-007', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-007','DISC-I-007','test-type-disc','DISC_TAXONOMY_V1','v1','Saya mudah membangun percakapan dengan orang yang baru saya kenal.','I','I_BEHAVIOR','I_007','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-008','DISC-I-008', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-008','DISC-I-008','test-type-disc','DISC_TAXONOMY_V1','v1','Saya senang membagikan ide dan membuat orang lain tertarik.','I','I_BEHAVIOR','I_008','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-009','DISC-I-009', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-009','DISC-I-009','test-type-disc','DISC_TAXONOMY_V1','v1','Saya biasanya menunjukkan antusiasme ketika bekerja bersama orang lain.','I','I_BEHAVIOR','I_009','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-010','DISC-I-010', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-010','DISC-I-010','test-type-disc','DISC_TAXONOMY_V1','v1','Saya nyaman memengaruhi keputusan melalui komunikasi dan persuasi.','I','I_BEHAVIOR','I_010','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-011','DISC-I-011', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-011','DISC-I-011','test-type-disc','DISC_TAXONOMY_V1','v1','Saya menikmati lingkungan yang memberi banyak kesempatan untuk berinteraksi.','I','I_BEHAVIOR','I_011','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-I-012','DISC-I-012', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-i-012','DISC-I-012','test-type-disc','DISC_TAXONOMY_V1','v1','Saya cenderung mengekspresikan pikiran dan perasaan secara terbuka.','I','I_BEHAVIOR','I_012','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-013','DISC-S-013', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-013','DISC-S-013','test-type-disc','DISC_TAXONOMY_V1','v1','Saya menghargai kerja sama yang tenang dan saling mendukung.','S','S_BEHAVIOR','S_013','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-014','DISC-S-014', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-014','DISC-S-014','test-type-disc','DISC_TAXONOMY_V1','v1','Saya berusaha menjaga hubungan kerja tetap harmonis.','S','S_BEHAVIOR','S_014','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-015','DISC-S-015', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-015','DISC-S-015','test-type-disc','DISC_TAXONOMY_V1','v1','Saya nyaman membantu orang lain menyelesaikan tugasnya.','S','S_BEHAVIOR','S_015','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-016','DISC-S-016', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-016','DISC-S-016','test-type-disc','DISC_TAXONOMY_V1','v1','Saya lebih suka perubahan yang dijelaskan dengan jelas sebelum diterapkan.','S','S_BEHAVIOR','S_016','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-017','DISC-S-017', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-017','DISC-S-017','test-type-disc','DISC_TAXONOMY_V1','v1','Saya dapat menjaga konsistensi ketika menjalankan rutinitas.','S','S_BEHAVIOR','S_017','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-S-018','DISC-S-018', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-s-018','DISC-S-018','test-type-disc','DISC_TAXONOMY_V1','v1','Saya biasanya memberi waktu kepada orang lain untuk menyampaikan pandangannya.','S','S_BEHAVIOR','S_018','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-019','DISC-C-019', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-019','DISC-C-019','test-type-disc','DISC_TAXONOMY_V1','v1','Saya memperhatikan detail sebelum menyimpulkan sesuatu.','C','C_BEHAVIOR','C_019','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-020','DISC-C-020', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-020','DISC-C-020','test-type-disc','DISC_TAXONOMY_V1','v1','Saya lebih nyaman bekerja dengan standar dan prosedur yang jelas.','C','C_BEHAVIOR','C_020','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-021','DISC-C-021', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-021','DISC-C-021','test-type-disc','DISC_TAXONOMY_V1','v1','Saya memeriksa kembali pekerjaan untuk menjaga ketepatan.','C','C_BEHAVIOR','C_021','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-022','DISC-C-022', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-022','DISC-C-022','test-type-disc','DISC_TAXONOMY_V1','v1','Saya cenderung mengumpulkan informasi sebelum mengambil keputusan.','C','C_BEHAVIOR','C_022','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-023','DISC-C-023', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-023','DISC-C-023','test-type-disc','DISC_TAXONOMY_V1','v1','Saya menghargai kualitas dan ketelitian meskipun membutuhkan waktu lebih lama.','C','C_BEHAVIOR','C_023','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt") VALUES ('DISC-C-024','DISC-C-024', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('disc-qv-c-024','DISC-C-024','test-type-disc','DISC_TAXONOMY_V1','v1','Saya merasa nyaman ketika kriteria keberhasilan dapat didefinisikan dengan jelas.','C','C_BEHAVIOR','C_024','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','DISC_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
