# Tasks: User Settings Page

**Input**: Design documents from `/specs/004-user-settings/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and create shared directories

- [x] T001 Create `src/app/(dashboard)/settings/_components/` directory (client form co-location)
- [x] T002 Confirm no DB migrations required (data-model.md: no schema changes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Zod schemas and server actions required before any form can be built

**⚠️ CRITICAL**: Phases 3–5 depend on these files being present

- [x] T003 Create Zod schemas in `src/schemas/profile.ts` (`updateNameSchema`, `updateSlugSchema`, `UpdateNameSuccessData`, `UpdateSlugSuccessData`)
- [x] T004 Create server actions in `src/actions/profile-actions.ts` (`updateNameAction`, `updateSlugAction`) following auth-actions.ts pattern with two-layer slug uniqueness defence

**Checkpoint**: Foundation ready — form components, page, and tests can now be implemented

---

## Phase 3: User Story 1 — Update Vanity Slug (Priority: P1) 🎯 MVP

**Goal**: Authenticated user can update their vanity slug from `/dashboard/settings` with uniqueness validation, inline feedback, and same-slug-no-conflict support.

**Independent Test**: Navigate to `/dashboard/settings`, enter a new slug, submit → see success state and updated URL preview. Enter a taken slug → see "This URL is already taken." Enter invalid chars → see inline validation error before server call.

### Tests for User Story 1

- [x] T005 [P] [US1] Unit tests for `updateSlugAction` in `tests/unit/actions/profile-actions.test.ts` (unauthenticated, valid, taken, race-condition 23505, format validation, own-slug no-conflict)
- [x] T006 [P] [US1] Component tests for `SlugSettingsForm` in `tests/component/settings/SlugSettingsForm.test.tsx` (renders with initial value, shows field error, shows success, submit triggers action)

### Implementation for User Story 1

- [x] T007 [US1] Create `SlugSettingsForm.tsx` in `src/app/(dashboard)/settings/_components/SlugSettingsForm.tsx` (Card + `useFormState` + `updateSlugAction`, shows current slug, inline field/success/error feedback)

**Checkpoint**: `updateSlugAction` and `SlugSettingsForm` fully functional and tested independently

---

## Phase 4: User Story 2 — Update Display Name (Priority: P2)

**Goal**: Authenticated user can update their display name from `/dashboard/settings`; page re-renders with new value immediately.

**Independent Test**: Navigate to `/dashboard/settings`, edit the Name field, submit → page re-renders with new value. Submit empty → inline validation error.

### Tests for User Story 2

- [x] T008 [P] [US2] Unit tests for `updateNameAction` in `tests/unit/actions/profile-actions.test.ts` (unauthenticated, valid, empty name, name too long)
- [x] T009 [P] [US2] Component tests for `NameSettingsForm` in `tests/component/settings/NameSettingsForm.test.tsx` (renders with initial value, shows field error, shows success, submit triggers action)

### Implementation for User Story 2

- [x] T010 [US2] Create `NameSettingsForm.tsx` in `src/app/(dashboard)/settings/_components/NameSettingsForm.tsx` (Card + `useFormState` + `updateNameAction`, pre-populated name field, inline feedback)

**Checkpoint**: `updateNameAction` and `NameSettingsForm` fully functional and tested independently

---

## Phase 5: User Story 3 — Update Password (Priority: P3)

**Goal**: Authenticated user can change their password from `/dashboard/settings`; reuses existing `passwordChangeAction` + `PasswordChangeForm` with no duplication.

**Independent Test**: Navigate to `/dashboard/settings`; enter correct current password and new valid password → success message inline. Enter wrong current password → "Current password is incorrect."

### Implementation for User Story 3

- [x] T011 [US3] Embed `<PasswordChangeForm />` from `src/app/(dashboard)/settings/password/password-change-form.tsx` inside the unified settings page (reuse only — zero new logic)

**Checkpoint**: All three form sections (slug, name, password) independently functional

---

## Phase 6: Unified Settings Page

**Goal**: Single `/dashboard/settings` server component that loads profile data, renders three sections, is protected by auth middleware.

- [x] T012 Create server component `src/app/(dashboard)/settings/page.tsx` — calls `getSession()`, queries `users` table for `name` + `vanitySlug`, passes props to `SlugSettingsForm`, `NameSettingsForm`, and renders `PasswordChangeForm`
- [x] T013 [P] Integration test for slug uniqueness in `tests/integration/profile-actions.integration.test.ts` (end-to-end against DB: unique slug saves, duplicate returns field error, own-slug no-conflict)
- [x] T014 [P] E2E test for settings page in `tests/e2e/settings.spec.ts` (full journey: load page, update slug, update name, password validation errors)

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T015 Verify `src/middleware.ts` already covers `/dashboard/settings` route protection (no code change expected — confirm only)

---

## Dependencies

```
T003 (schemas)
  └── T004 (actions)
        ├── T005 (slug unit tests)     [P with T006]
        ├── T006 (slug component tests)[P with T005]
        ├── T007 (SlugSettingsForm)
        ├── T008 (name unit tests)     [P with T009]
        ├── T009 (name component tests)[P with T008]
        ├── T010 (NameSettingsForm)
        └── T011 (PasswordChangeForm embed)
              └── T012 (settings page.tsx)
                    ├── T013 (integration tests) [P with T014]
                    └── T014 (E2E tests)          [P with T013]
T002, T015 — independent verification tasks
```

## Parallel Execution

- After T004: run T005, T006, T008, T009 in parallel (all target different files, no cross-dependencies)
- After T012: run T013 and T014 in parallel

## Implementation Strategy

**MVP (User Story 1 only)**: T001 → T003 → T004 → T007 → T012 (slug section only, no name or password) — lets the team ship slug editing first and get real user feedback before adding the remaining sections.

**Full delivery**: Complete all phases in order. Each phase is independently testable.
