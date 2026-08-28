-- READY SCORE V4 L6
-- Cognitive MVP

-- Launch-safe cognitive reasoning profile. This is not a formal IQ instrument.
-- Four reasoning dimensions, 6 operational Likert items each.

ALTER TYPE "AssessmentType" ADD VALUE IF NOT EXISTS 'COGNITIVE';

UPDATE "TestType"
SET "status"='ACTIVE', "runtimeKey"='COGNITIVE',
    "name"='Cognitive Ability Profile',
    "description"='Customer-facing Cognitive Reasoning Assessment MVP. Results are a cognitive reasoning profile and do not constitute an IQ score.'
WHERE "code"='COGNITIVE';

INSERT INTO "TaxonomyVersion" ("id","testTypeId","version","status","sourceVersion","metadata")
VALUES ('taxonomy-cognitive-v1','test-type-cognitive','COGNITIVE_TAXONOMY_V1','ACTIVE','V4_L6_COGNITIVE_MVP','{"architectureVersion":"V4_L6_COGNITIVE_MVP","instrumentStatus":"MVP","claimStatus":"cognitive_reasoning_profile_only"}')
ON CONFLICT ("testTypeId","version") DO NOTHING;
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('cognitive-domain-verbal_reasoning','taxonomy-cognitive-v1','VERBAL_REASONING','Verbal Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('cognitive-domain-numerical_reasoning','taxonomy-cognitive-v1','NUMERICAL_REASONING','Numerical Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('cognitive-domain-logical_reasoning','taxonomy-cognitive-v1','LOGICAL_REASONING','Logical Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;
INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('cognitive-domain-abstract_reasoning','taxonomy-cognitive-v1','ABSTRACT_REASONING','Abstract Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-001','COG-V-001',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-001','COG-V-001','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Ketika membaca informasi yang panjang, saya dapat menangkap gagasan utama dengan cukup cepat.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_001','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-002','COG-V-002',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-002','COG-V-002','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat membandingkan makna dua pernyataan yang menggunakan kata-kata berbeda.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_002','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-003','COG-V-003',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-003','COG-V-003','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya biasanya dapat menjelaskan kembali informasi dengan kata-kata saya sendiri.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_003','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-004','COG-V-004',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-004','COG-V-004','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat melihat hubungan antara sebuah istilah dan konteks penggunaannya.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_004','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-005','COG-V-005',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-005','COG-V-005','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya cukup mudah mengenali kesimpulan yang mengikuti dari informasi tertulis.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_005','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-V-006','COG-V-006',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-006','COG-V-006','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat membedakan pernyataan yang relevan dari detail yang tidak membantu memahami suatu persoalan.','VERBAL_REASONING','VERBAL_REASONING_CORE', 'V_006','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-007','COG-N-007',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-007','COG-N-007','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat memahami perubahan nilai ketika angka dibandingkan dari satu kondisi ke kondisi lain.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_007','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-008','COG-N-008',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-008','COG-N-008','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya cukup nyaman mencari pola sederhana dalam deret atau data angka.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_008','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-009','COG-N-009',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-009','COG-N-009','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat memperkirakan hasil perhitungan sebelum memeriksa angka secara rinci.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_009','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-010','COG-N-010',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-010','COG-N-010','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menggunakan informasi kuantitatif untuk membandingkan beberapa pilihan.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_010','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-011','COG-N-011',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-011','COG-N-011','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat memahami hubungan proporsi atau perbandingan dalam informasi sehari-hari.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_011','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-N-012','COG-N-012',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-012','COG-N-012','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat memeriksa apakah hasil perhitungan masuk akal terhadap konteks masalah.','NUMERICAL_REASONING','NUMERICAL_REASONING_CORE', 'N_012','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-013','COG-L-013',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-013','COG-L-013','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menguraikan sebuah masalah menjadi hubungan sebab dan akibat.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_013','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-014','COG-L-014',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-014','COG-L-014','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat mengikuti aturan yang diberikan untuk menentukan kesimpulan.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_014','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-015','COG-L-015',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-015','COG-L-015','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya cukup mudah menemukan langkah yang tidak konsisten dalam sebuah penalaran.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_015','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-016','COG-L-016',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-016','COG-L-016','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat membandingkan beberapa kondisi untuk menentukan mana yang paling logis.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_016','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-017','COG-L-017',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-017','COG-L-017','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menggunakan informasi yang tersedia tanpa menambahkan asumsi yang tidak diperlukan.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_017','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-L-018','COG-L-018',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-018','COG-L-018','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menyusun urutan langkah yang masuk akal untuk mencapai suatu kesimpulan.','LOGICAL_REASONING','LOGICAL_REASONING_CORE', 'L_018','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-019','COG-A-019',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-019','COG-A-019','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya cukup mudah mengenali pola ketika informasi tidak disajikan dalam bentuk cerita.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_019','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-020','COG-A-020',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-020','COG-A-020','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menemukan kesamaan struktur dari contoh yang tampak berbeda.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_020','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-021','COG-A-021',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-021','COG-A-021','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat menyesuaikan aturan yang saya temukan pada contoh baru.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_021','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-022','COG-A-022',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-022','COG-A-022','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya biasanya dapat mengenali perubahan pola meskipun bentuk informasinya berbeda.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_022','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-023','COG-A-023',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-023','COG-A-023','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat memahami hubungan antarbagian dalam suatu pola yang kompleks.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_023','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('COG-A-024','COG-A-024',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('cognitive-qv-024','COG-A-024','test-type-cognitive','COGNITIVE_TAXONOMY_V1','v1','Saya dapat mencoba beberapa kemungkinan sampai menemukan aturan yang menjelaskan sebuah pola.','ABSTRACT_REASONING','ABSTRACT_REASONING_CORE', 'A_024','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','COGNITIVE_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;
-- Explicit lifecycle reconciliation for idempotent re-deployments.
UPDATE "QuestionVersion"
SET "status"='PUBLISHED', "mappingStatus"='APPROVED', "updatedAt"=CURRENT_TIMESTAMP
WHERE "testTypeId"='test-type-cognitive' AND "taxonomyVersion"='COGNITIVE_TAXONOMY_V1' AND "version"='v1';
