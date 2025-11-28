# Tasks: Local Development Environment Setup

**Input**: Design documents from `/specs/001-local-dev-setup/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓, contracts/ (N/A - infrastructure feature)

**Tests**: Not explicitly requested in spec - test infrastructure setup only, no test tasks for individual features.

**Organization**: Tasks are grouped by user story (US1-US6) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project structure follows Next.js App Router with `src/` directory:

- Application code: `src/app/`, `src/components/`, `src/lib/`, `src/db/`
- Tests: `tests/unit/`, `tests/component/`, `tests/e2e/`
- Configuration: Root level (`package.json`, `tsconfig.json`, etc.)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the base Next.js project with required tooling

- [x] T001 Initialize Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, App Router, and src/ directory using `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [x] T002 [P] Create `.nvmrc` file with Node.js version `20` at repository root
- [x] T003 [P] Add engines field to `package.json` specifying `node >=20.0.0` and `pnpm >=8.0.0`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Install Supabase CLI as dev dependency: `pnpm add -D supabase`
- [x] T005 Install Drizzle ORM dependencies: `pnpm add drizzle-orm postgres && pnpm add -D drizzle-kit`
- [x] T006 Install Supabase JS client: `pnpm add @supabase/supabase-js`
- [x] T007 [P] Create base directory structure: `src/db/schema/`, `src/db/migrations/`, `src/db/seed/`, `src/lib/supabase/`, `src/lib/utils/`, `src/types/`
- [x] T008 [P] Create test directory structure: `tests/unit/`, `tests/component/`, `tests/e2e/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Initial Project Setup (Priority: P1) 🎯 MVP

**Goal**: Enable developers to clone the repository and start the development server with hot reload working

**Independent Test**: Clone repo, run `pnpm install && pnpm dev`, verify homepage loads at localhost:3000, make a code change and verify hot reload

### Implementation for User Story 1

- [x] T009 [US1] Create root layout with basic HTML structure in `src/app/layout.tsx`
- [x] T010 [US1] Create homepage placeholder with "YourFavs" title in `src/app/page.tsx`
- [x] T011 [US1] Configure `next.config.js` with strict mode and any required Next.js settings
- [x] T012 [US1] Create `src/lib/utils/cn.ts` utility for Tailwind CSS className merging using clsx and tailwind-merge (required by shadcn/ui components)

**Checkpoint**: At this point, User Story 1 should be fully functional - `pnpm dev` works with hot reload

---

## Phase 4: User Story 2 - Local Database Development (Priority: P1)

**Goal**: Provide a local database environment with schema and seed data for development

**Independent Test**: Run `pnpm supabase:start`, run migrations, verify 5 tables exist, run seed, verify 8 categories in database

### Implementation for User Story 2

- [x] T013 [US2] Initialize Supabase local configuration with `npx supabase init` creating `supabase/config.toml`
- [x] T014 [US2] Create Drizzle configuration file at `drizzle.config.ts` with schema path `./src/db/schema/index.ts` and migrations output `./src/db/migrations`
- [x] T015 [P] [US2] Create User schema definition in `src/db/schema/user.ts` per data-model.md specification
- [x] T016 [P] [US2] Create Category schema definition in `src/db/schema/category.ts` per data-model.md specification
- [x] T017 [P] [US2] Create List schema definition in `src/db/schema/list.ts` per data-model.md specification
- [x] T018 [P] [US2] Create Place schema definition in `src/db/schema/place.ts` per data-model.md specification
- [x] T019 [P] [US2] Create ListPlace schema definition in `src/db/schema/listPlace.ts` per data-model.md specification
- [x] T020 [US2] Create schema index file exporting all entities in `src/db/schema/index.ts`
- [x] T021 [US2] Create database client configuration in `src/db/index.ts` using postgres.js driver
- [x] T022 [US2] Create seed script in `src/db/seed/categories.ts` with 8 predefined categories (coffee-cafes, restaurants, bars-nightlife, breakfast-brunch, date-night, family-friendly, outdoor-nature, workspaces)
- [x] T023 [US2] Create seed runner script in `src/db/seed/index.ts` that executes all seed scripts
- [x] T024 [US2] Add database scripts to `package.json`: `db:generate`, `db:migrate`, `db:seed`, `db:studio`, `supabase:start`, `supabase:stop`, `supabase:status`

**Checkpoint**: At this point, User Story 2 should be fully functional - local database runs with migrations and seed data

---

## Phase 5: User Story 3 - Environment Configuration (Priority: P1)

**Goal**: Clear guidance on environment variables with validation at startup

**Independent Test**: Copy `.env.example` to `.env.local`, fill in values, start app - no missing variable errors; delete a required variable, start app - see clear error message

### Implementation for User Story 3

- [x] T025 [US3] Create `.env.example` with all required variables documented: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `GOOGLE_PLACES_API_KEY` (optional)
- [x] T026 [US3] Add `.env.local` to `.gitignore` to prevent committing secrets
- [x] T027 [US3] Create environment validation module in `src/lib/env.ts` that validates required variables at startup and throws helpful error messages
- [x] T028 [US3] Create Supabase client configuration in `src/lib/supabase/client.ts` using environment variables for browser client
- [x] T029 [US3] Create Supabase server client configuration in `src/lib/supabase/server.ts` using environment variables for server-side operations

**Checkpoint**: At this point, User Story 3 should be fully functional - environment configuration is documented and validated

---

## Phase 6: User Story 4 - Code Quality Verification (Priority: P2)

**Goal**: Enable developers to run linting, formatting, and type checking locally

**Independent Test**: Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck` - all complete without configuration errors

### Implementation for User Story 4

- [x] T030 [US4] Install Prettier and ESLint integration: `pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier`
- [x] T031 [US4] Create Prettier configuration in `.prettierrc` with project formatting rules (singleQuote, semi, tabWidth, etc.)
- [x] T032 [US4] Create `.prettierignore` to exclude generated files, node_modules, and build artifacts
- [x] T033 [US4] Update ESLint configuration in `.eslintrc.json` to extend `next/core-web-vitals` and integrate Prettier
- [x] T034 [US4] Update `tsconfig.json` with strict TypeScript settings and path aliases
- [x] T035 [US4] Add code quality scripts to `package.json`: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`

**Checkpoint**: At this point, User Story 4 should be fully functional - linting, formatting, and type checking work

---

## Phase 7: User Story 5 - Running Tests Locally (Priority: P2)

**Goal**: Enable developers to run unit, component, and E2E tests locally

**Independent Test**: Run `pnpm test`, `pnpm test:e2e` - test frameworks execute and report results (even with no tests yet)

### Implementation for User Story 5

- [x] T036 [US5] Install Vitest and React Testing Library: `pnpm add -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom @vitejs/plugin-react`
- [x] T037 [US5] Create Vitest configuration in `vitest.config.ts` with jsdom environment, coverage settings, and test file patterns
- [x] T038 [US5] Create Vitest setup file in `tests/setup.ts` with React Testing Library configuration and jest-dom matchers
- [x] T039 [US5] Install Playwright: `pnpm add -D @playwright/test` and run `npx playwright install`
- [x] T040 [US5] Create Playwright configuration in `playwright.config.ts` with browser targets, base URL, and test directory
- [x] T041 [US5] Add test scripts to `package.json`: `test`, `test:watch`, `test:coverage`, `test:ui`, `test:e2e`, `test:e2e:ui`

**Checkpoint**: At this point, User Story 5 should be fully functional - test commands execute without errors

---

## Phase 8: User Story 6 - Development Documentation (Priority: P2)

**Goal**: Comprehensive documentation enabling developers to be self-sufficient

**Independent Test**: A new developer follows the README without requiring additional verbal instructions

### Implementation for User Story 6

- [x] T042 [US6] Update root `README.md` with project overview, quick start guide, prerequisite versions (Node.js 20+, pnpm 8+, Docker 24+), and link to detailed quickstart
- [x] T043 [US6] Copy and adapt quickstart content from `specs/001-local-dev-setup/quickstart.md` to `docs/QUICKSTART.md` with command reference table
- [x] T044 [US6] Create troubleshooting guide in `docs/TROUBLESHOOTING.md` covering Docker issues, database issues, Node.js issues, and environment issues

**Checkpoint**: At this point, User Story 6 should be fully functional - documentation is complete and accurate

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T045 [P] Add editor configuration in `.editorconfig` for consistent formatting across IDEs
- [x] T046 [P] Create VS Code recommended extensions in `.vscode/extensions.json` (ESLint, Prettier, Tailwind CSS IntelliSense)
- [x] T047 [P] Create VS Code workspace settings in `.vscode/settings.json` for format on save and lint on save
- [x] T048 Run quickstart.md validation end-to-end: fresh clone, install, start Supabase, migrate, seed, dev server, verify homepage loads

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 - delivers working dev server
- **US2 (Phase 4)**: Depends on Phase 2 - can run in parallel with US1
- **US3 (Phase 5)**: Depends on Phase 2 and US2 (needs Supabase config)
- **US4 (Phase 6)**: Depends on Phase 1 only - can run early in parallel
- **US5 (Phase 7)**: Depends on Phase 1 only - can run early in parallel
- **US6 (Phase 8)**: Depends on all P1 stories (US1-US3) for accurate documentation
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Can Start After | Dependencies                            |
| ----- | -------- | --------------- | --------------------------------------- |
| US1   | P1       | Phase 2         | None - delivers working Next.js app     |
| US2   | P1       | Phase 2         | None - delivers database infrastructure |
| US3   | P1       | US2             | Needs Supabase config from US2          |
| US4   | P2       | Phase 1         | None - only needs base project          |
| US5   | P2       | Phase 1         | None - only needs base project          |
| US6   | P2       | US1, US2, US3   | Documents the complete setup flow       |

### Within Each User Story

1. Models/schemas before services
2. Configuration before implementation
3. Core implementation before integration
4. All story tasks complete before marking story done

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel after T001
- **Phase 2**: T007 and T008 can run in parallel; T004-T006 are sequential installs
- **US2**: T015, T016, T017, T018, T019 (all schema files) can run in parallel
- **US4**: Can start in parallel with US1, US2 (different files)
- **US5**: Can start in parallel with US1, US2 (different files)
- **Phase 9**: T045, T046, T047 can all run in parallel

---

## Parallel Example: User Story 2 Database Setup

```bash
# After T014 (Drizzle config), launch all schema files in parallel:
Task T015: "Create User schema in src/db/schema/user.ts"
Task T016: "Create Category schema in src/db/schema/category.ts"
Task T017: "Create List schema in src/db/schema/list.ts"
Task T018: "Create Place schema in src/db/schema/place.ts"
Task T019: "Create ListPlace schema in src/db/schema/listPlace.ts"

# Then sequential: T020 (index), T021 (client), T022-T024 (seed and scripts)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: US1 - Dev Server (T009-T012)
4. Complete Phase 4: US2 - Database (T013-T024)
5. Complete Phase 5: US3 - Environment (T025-T029)
6. **STOP and VALIDATE**: Run quickstart flow end-to-end
7. Deploy/demo if ready - basic local dev environment functional

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test dev server → Working Next.js app
3. Add US2 → Test database → Database with schema and seed data
4. Add US3 → Test environment → Environment configuration validated
5. Add US4 → Test linting → Code quality tools working
6. Add US5 → Test testing → Test infrastructure ready
7. Add US6 → Test documentation → Developer onboarding complete
8. Polish → Final validation → Production-ready local dev setup

### Parallel Team Strategy

With multiple developers after Phase 2:

- Developer A: US1 (dev server) first, then US2 (database) - completing US1 first provides debugging foundation
- Developer B: US4 (linting) + US5 (testing) - independent of other stories
- Developer C: US3 (environment) after US2 completes, then US6 (docs)

---

## Summary

| Metric                   | Count |
| ------------------------ | ----- |
| Total Tasks              | 48    |
| Setup Phase Tasks        | 3     |
| Foundational Phase Tasks | 5     |
| US1 Tasks                | 4     |
| US2 Tasks                | 12    |
| US3 Tasks                | 5     |
| US4 Tasks                | 6     |
| US5 Tasks                | 6     |
| US6 Tasks                | 3     |
| Polish Tasks             | 4     |
| Parallelizable Tasks     | 16    |

### Format Validation ✅

All tasks follow the required format:

- Checkbox: `- [ ]`
- Task ID: Sequential T001-T048
- [P] marker: For parallelizable tasks
- [Story] label: US1-US6 for user story phases
- Description: Includes exact file paths

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is an infrastructure feature - no API contracts or business logic tests
