# ReadyScore Landing Page v1.0

Code-first landing page implementation following ReadyScore Design System v1.0.

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- Lucide React

## Routes
- `/` — Landing Page
- `/trial` — placeholder destination for Free 20-question assessment
- `/app` — placeholder destination for Premium application

## Run
```bash
pnpm install
pnpm dev
```


## Development Governance

See `docs/ReadyScore_Development_Roadmap_Phase_Constitution_v1.0.md` and `docs/ReadyScore_Phase_2_1_Assessment_Data_Model_v1.0.md` before changing assessment architecture.


Phase 2.8 v1.1: Question Bank Administration & Publishing.


Phase 2.12 — Premium Result & Full Analysis v1.0.


Phase 2.14 — Assessment Ownership & History v1.0.


Phase 2.15.1 — PostgreSQL & Prisma Database Foundation v1.0.

## Phase 2.15.2
Core Assessment Database Schema has been added to `prisma/schema.prisma`. Existing runtime/auth JSON stores remain active until their dedicated migration phases.


## v1.1 Correction
The Phase 2.15.2 package now includes the existing Phase 2.15.1 foundation migration
`20260822120013_foundation`. This is required because the database already applied that
migration. Do NOT run `prisma migrate reset`.
