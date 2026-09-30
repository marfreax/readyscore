-- ReadyScore V19.2 — Learning Preference enum activation
-- PostgreSQL requires newly added enum values to be committed before they
-- can be referenced by INSERT/UPDATE statements in a later transaction.

ALTER TYPE "AssessmentType" ADD VALUE IF NOT EXISTS 'LEARNING_PREFERENCE';
ALTER TYPE "ReassessmentTestType" ADD VALUE IF NOT EXISTS 'LEARNING_PREFERENCE';
