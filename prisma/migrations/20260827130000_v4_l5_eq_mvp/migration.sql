-- READY SCORE V4 L5

-- EQ MVP

-- Four conceptual dimensions from V4 L5 operating rules.

-- 24-item operational MVP: 6 items per dimension. Successful runtime is not psychometric validation.

ALTER TYPE "AssessmentType" ADD VALUE IF NOT EXISTS 'EQ';

UPDATE "TestType"
SET "status"='ACTIVE', "runtimeKey"='EQ', "description"='Customer-facing EQ assessment MVP covering four conceptual dimensions from V4 L5.'
WHERE "code"='EQ';

INSERT INTO "TaxonomyVersion" ("id","testTypeId","version","status","sourceVersion","metadata")
VALUES ('taxonomy-eq-v1','test-type-eq','EQ_TAXONOMY_V1','ACTIVE','V4_L5_EQ_MVP','{"architectureVersion":"V4_L5_EQ_MVP","instrumentStatus":"MVP","claimStatus":"behavioral_emotional_profile_only"}')
ON CONFLICT ("testTypeId","version") DO NOTHING;

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('eq-domain-emotion-awareness','taxonomy-eq-v1','EMOTION_AWARENESS','Emotion Awareness','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('eq-domain-emotion-regulation','taxonomy-eq-v1','EMOTION_REGULATION','Emotion Regulation','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('eq-domain-empathy-social-awareness','taxonomy-eq-v1','EMPATHY_SOCIAL_AWARENESS','Empathy / Social Awareness','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES ('eq-domain-relationship-social-response','taxonomy-eq-v1','RELATIONSHIP_SOCIAL_RESPONSE','Relationship / Social Response','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-001','EQ-A-001',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-001','EQ-A-001','test-type-eq','EQ_TAXONOMY_V1','v1','Menyadari perubahan emosi saya ketika menghadapi situasi yang berbeda.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_001','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-002','EQ-A-002',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-002','EQ-A-002','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat mengenali emosi yang sedang saya rasakan sebelum bertindak.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_002','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-003','EQ-A-003',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-003','EQ-A-003','test-type-eq','EQ_TAXONOMY_V1','v1','Saya cukup peka terhadap hal-hal yang biasanya memengaruhi suasana hati saya.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_003','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-004','EQ-A-004',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-004','EQ-A-004','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat membedakan antara perasaan yang saya alami dan tindakan yang saya pilih.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_004','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-005','EQ-A-005',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-005','EQ-A-005','test-type-eq','EQ_TAXONOMY_V1','v1','Saya menyadari ketika tekanan mulai memengaruhi cara saya berpikir.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_005','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-A-006','EQ-A-006',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-006','EQ-A-006','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat menjelaskan kepada diri sendiri apa yang sedang saya rasakan.','EMOTION_AWARENESS','EMOTION_AWARENESS_CORE','A_006','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-007','EQ-R-007',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-007','EQ-R-007','test-type-eq','EQ_TAXONOMY_V1','v1','Ketika emosi meningkat, saya dapat memberi jeda sebelum merespons.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_007','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-008','EQ-R-008',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-008','EQ-R-008','test-type-eq','EQ_TAXONOMY_V1','v1','Saya berusaha menenangkan diri ketika menghadapi situasi yang membuat tertekan.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_008','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-009','EQ-R-009',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-009','EQ-R-009','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat menyesuaikan respons saya agar tidak dikendalikan oleh emosi sesaat.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_009','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-010','EQ-R-010',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-010','EQ-R-010','test-type-eq','EQ_TAXONOMY_V1','v1','Saya tetap dapat mempertimbangkan pilihan dengan tenang ketika sedang kesal.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_010','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-011','EQ-R-011',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-011','EQ-R-011','test-type-eq','EQ_TAXONOMY_V1','v1','Saya memiliki cara yang membantu saya kembali fokus setelah mengalami tekanan.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_011','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-R-012','EQ-R-012',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-012','EQ-R-012','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat menunda reaksi ketika respons cepat berisiko memperburuk keadaan.','EMOTION_REGULATION','EMOTION_REGULATION_CORE','R_012','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-013','EQ-E-013',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-013','EQ-E-013','test-type-eq','EQ_TAXONOMY_V1','v1','Saya berusaha memahami bahwa orang lain dapat merasakan sesuatu secara berbeda dari saya.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_013','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-014','EQ-E-014',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-014','EQ-E-014','test-type-eq','EQ_TAXONOMY_V1','v1','Saya memperhatikan tanda-tanda ketika orang lain tampak tidak nyaman atau tertekan.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_014','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-015','EQ-E-015',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-015','EQ-E-015','test-type-eq','EQ_TAXONOMY_V1','v1','Saya mencoba memahami sudut pandang orang lain sebelum memberikan penilaian.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_015','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-016','EQ-E-016',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-016','EQ-E-016','test-type-eq','EQ_TAXONOMY_V1','v1','Saya mendengarkan untuk memahami apa yang sedang dialami orang lain.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_016','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-017','EQ-E-017',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-017','EQ-E-017','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat menyesuaikan cara merespons setelah memahami keadaan emosional orang lain.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_017','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-E-018','EQ-E-018',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-018','EQ-E-018','test-type-eq','EQ_TAXONOMY_V1','v1','Saya mempertimbangkan dampak respons saya terhadap perasaan orang lain.','EMPATHY_SOCIAL_AWARENESS','EMPATHY_SOCIAL_AWARENESS_CORE','E_018','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-019','EQ-S-019',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-019','EQ-S-019','test-type-eq','EQ_TAXONOMY_V1','v1','Saya berusaha menyampaikan respons yang tetap menghargai orang lain ketika terjadi perbedaan.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_019','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-020','EQ-S-020',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-020','EQ-S-020','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat menjaga komunikasi tetap konstruktif ketika percakapan menjadi sulit.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_020','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-021','EQ-S-021',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-021','EQ-S-021','test-type-eq','EQ_TAXONOMY_V1','v1','Saya berusaha menyelesaikan ketegangan dengan membicarakan masalah secara terbuka.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_021','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-022','EQ-S-022',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-022','EQ-S-022','test-type-eq','EQ_TAXONOMY_V1','v1','Saya dapat mempertahankan hubungan kerja atau sosial ketika terjadi ketidaksepakatan.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_022','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-023','EQ-S-023',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-023','EQ-S-023','test-type-eq','EQ_TAXONOMY_V1','v1','Saya memberi ruang kepada orang lain untuk menyampaikan perasaan atau pandangannya.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_023','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

INSERT INTO "Question" ("id","code","createdAt","updatedAt")
VALUES ('EQ-S-024','EQ-S-024',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionVersion"
("id","questionId","testTypeId","taxonomyVersion","version","text","domain","subdomain","indicator","type","answerType","reverseScore","weight","scale","scoringKey","difficulty","status","mappingStatus","sourceFile","createdAt","updatedAt")
VALUES
('eq-qv-024','EQ-S-024','test-type-eq','EQ_TAXONOMY_V1','v1','Saya berusaha menunjukkan dukungan yang sesuai ketika orang lain membutuhkan respons saya.','RELATIONSHIP_SOCIAL_RESPONSE','RELATIONSHIP_SOCIAL_RESPONSE_CORE','S_024','LIKERT','LIKERT_5',false,1,'{1,2,3,4,5}','{1,2,3,4,5}','MEDIUM','PUBLISHED','APPROVED','EQ_MVP_V1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("questionId","version") DO NOTHING;

-- End of EQ MVP seed.
