# V9.4 Cognitive Question Bank — Implementation Notes

## Scope
V9.4 implements the customer Cognitive question-bank boundary over the already locked V8.3 objective Cognitive instrument.

## Protected boundary
- 24 published Cognitive V2 items
- 4 dimensions × 6 items
- SINGLE_CHOICE_4 objective response model
- COGNITIVE_TAXONOMY_V2
- COGNITIVE_SCORE_V2
- COGNITIVE_RESULT_V2
- IQ claim remains prohibited
- historical QuestionVersion remains immutable
- customer runtime never receives correctOption

## Delivery rule
No database migration is introduced in V9.4. Existing V8.3 question/version storage is reused.

## Gate
Run `pnpm v9:4:gate` after `pnpm typecheck` and `pnpm build`.
