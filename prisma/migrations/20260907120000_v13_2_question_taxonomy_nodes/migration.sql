-- ReadyScore V13.2
-- Runtime package composition needs explicit taxonomy nodes for the active V2
-- instrument taxonomies. This migration adds taxonomy structure only; it does
-- not modify Question/QuestionVersion content or historical attempts.

INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
VALUES
('cognitive-v2-domain-verbal-reasoning','taxonomy-cognitive-v2','VERBAL_REASONING','Verbal Reasoning','DOMAIN',0),
('cognitive-v2-domain-numerical-reasoning','taxonomy-cognitive-v2','NUMERICAL_REASONING','Numerical Reasoning','DOMAIN',0),
('cognitive-v2-domain-logical-reasoning','taxonomy-cognitive-v2','LOGICAL_REASONING','Logical Reasoning','DOMAIN',0),
('cognitive-v2-domain-abstract-reasoning','taxonomy-cognitive-v2','ABSTRACT_REASONING','Abstract Reasoning','DOMAIN',0)
ON CONFLICT ("taxonomyId","code") DO NOTHING;

DO $$
DECLARE tax_id TEXT;
BEGIN
  SELECT "id" INTO tax_id FROM "TaxonomyVersion"
  WHERE "testTypeId"='test-type-disc' AND "version"='DISC_TAXONOMY_V2' LIMIT 1;
  IF tax_id IS NOT NULL THEN
    INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
    VALUES
    ('disc-v2-target-d',tax_id,'TARGET_D','Dominance Target','SUBDOMAIN',1),
    ('disc-v2-target-i',tax_id,'TARGET_I','Influence Target','SUBDOMAIN',1),
    ('disc-v2-target-s',tax_id,'TARGET_S','Steadiness Target','SUBDOMAIN',1),
    ('disc-v2-target-c',tax_id,'TARGET_C','Conscientiousness Target','SUBDOMAIN',1)
    ON CONFLICT ("taxonomyId","code") DO NOTHING;
  END IF;
END $$;

DO $$
DECLARE tax_id TEXT;
BEGIN
  SELECT "id" INTO tax_id FROM "TaxonomyVersion"
  WHERE "testTypeId"='test-type-eq' AND "version"='EQ_TAXONOMY_V2' LIMIT 1;
  IF tax_id IS NOT NULL THEN
    INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
    VALUES
    ('eq-v2-domain-emotion-awareness',tax_id,'EMOTION_AWARENESS','Emotion Awareness','DOMAIN',0),
    ('eq-v2-domain-emotion-regulation',tax_id,'EMOTION_REGULATION','Emotion Regulation','DOMAIN',0),
    ('eq-v2-domain-empathy-social-awareness',tax_id,'EMPATHY_SOCIAL_AWARENESS','Empathy / Social Awareness','DOMAIN',0),
    ('eq-v2-domain-relationship-social-response',tax_id,'RELATIONSHIP_SOCIAL_RESPONSE','Relationship / Social Response','DOMAIN',0)
    ON CONFLICT ("taxonomyId","code") DO NOTHING;
  END IF;
END $$;

DO $$
DECLARE tax_id TEXT;
BEGIN
  SELECT "id" INTO tax_id FROM "TaxonomyVersion"
  WHERE "testTypeId"='test-type-riasec' AND "version"='RIASEC_TAXONOMY_V2' LIMIT 1;
  IF tax_id IS NOT NULL THEN
    INSERT INTO "TaxonomyNode" ("id","taxonomyId","code","name","nodeType","level")
    VALUES
    ('riasec-v2-domain-r',tax_id,'R','Realistic','DOMAIN',0),
    ('riasec-v2-domain-i',tax_id,'I','Investigative','DOMAIN',0),
    ('riasec-v2-domain-a',tax_id,'A','Artistic','DOMAIN',0),
    ('riasec-v2-domain-s',tax_id,'S','Social','DOMAIN',0),
    ('riasec-v2-domain-e',tax_id,'E','Enterprising','DOMAIN',0),
    ('riasec-v2-domain-c',tax_id,'C','Conventional','DOMAIN',0)
    ON CONFLICT ("taxonomyId","code") DO NOTHING;
  END IF;
END $$;
