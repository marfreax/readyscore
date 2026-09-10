# V13.10 FIX7 — Production CSV Import Taxonomy Binding

The Admin Question Bank CSV import now binds each imported QuestionVersion to the active taxonomy version for its test type. This is required by V13.9 production eligibility, which only counts PUBLISHED + APPROVED questions whose taxonomyVersion matches the package taxonomy.

No measurement, scoring, database schema/migration, runtime selection, timer, or package eligibility semantics were changed.
