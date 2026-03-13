# Tasks: Brand Styling — myfaves Visual Identity

**Branch**: `001-brand-styling`  
**Input**: Design documents from `/specs/001-brand-styling/`  
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/wordmark.md ✅ · quickstart.md ✅

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no blocking dependency)
- **[Story]**: Which user story this implements (US1–US4 from spec.md)
- Setup + Foundational phases have no story label

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new utility file needed by US2 tasks before any component work begins.

- [ ] T001 Create `src/lib/utils/gradient.ts` with `BRAND_GRADIENTS` constant array (4 brand gradients) and `listCoverGradient(listId: string): string` deterministic hash function per data-model.md

**Checkpoint**: Gradient utility exists and is importable — US2 ListCard task (T012) can now proceed after Foundational completes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CSS token overhaul and font loading. **Everything else depends on this phase completing first.**

⚠️ **CRITICAL**: No user story implementation can begin until T002–T004 are complete.

- [ ] T002 Replace the `:root` light-mode token block and the `@media (prefers-color-scheme: dark)` token block in `src/app/globals.css` with brand values per plan.md token map (e.g. `--primary: #8B5CF6`, `--background: #F9FAFB`, `--ring: #8B5CF6` for light; `--background: #111827`, `--card: #1F2937`, `--ring: #C4B5FD` for dark); update `--radius` to `0.625rem`
- [ ] T003 Add `--font-serif: 'DM Serif Display', Georgia, serif` and `--font-sans: 'DM Sans', system-ui, sans-serif` to `:root` and to `@theme inline` in `src/app/globals.css`; update the `body` rule `font-family` to `var(--font-sans)` in `src/app/globals.css`
- [ ] T004 [P] Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and the Google Fonts stylesheet `<link>` (DM Serif Display 400 + DM Sans 300,400,500 with `display=swap`) to the `<head>` in `src/app/layout.tsx`

**Checkpoint**: Foundation ready — all CSS tokens and fonts are in place. All four user story phases can now begin.

---

## Phase 3: User Story 1 — Brand identity visible on every screen (Priority: P1) 🎯 MVP

**Goal**: Every page shows the "myfaves" two-colour wordmark; no MapPin icon; no "YourFavs" string in any user-visible surface.

**Independent Test**: Open `/`, `/dashboard`, and a public profile page. Browser tab titles all read "myfaves". Header and sidebar show the serif two-tone wordmark. No orange icon visible.

- [ ] T005 [US1] Replace the `<div>` containing the `<MapPin>` icon and "YourFavs" `<span>` with the canonical two-colour wordmark markup from `contracts/wordmark.md` (size `text-2xl`, `aria-label="myfaves home"` on the `<Link>`) in `src/components/shared/Header.tsx`
- [ ] T006 [P] [US1] Replace the `📍 YourFavs` heading string with the two-colour wordmark markup from `contracts/wordmark.md` (size `text-xl`) in `src/components/dashboard/DashboardSidebar.tsx`
- [ ] T007 [P] [US1] Update `metadata.title` from `"YourFavs"` to `"myfaves"` in `src/app/layout.tsx`
- [ ] T008 [P] [US1] Update `metadata.title` and `openGraph.title` from `"YourFavs"` to `"myfaves"` in `src/app/page.tsx`
- [ ] T009 [P] [US1] Replace all `"YourFavs"` occurrences in `generateMetadata` return values (title fallback, profile title, description string) in `src/app/profiles/[vanitySlug]/page.tsx`
- [ ] T010 [P] [US1] Replace all `"YourFavs"` occurrences in `generateMetadata` return values (list title, description string) in `src/app/profiles/[vanitySlug]/lists/[listSlug]/page.tsx`

**Checkpoint**: US1 fully functional. All wordmarks correct, all page titles read "myfaves". Can be demoed independently.

---

## Phase 4: User Story 2 — Brand colours replace generic neutrals (Priority: P1)

**Goal**: Page background is off-white (`#F9FAFB`), primary buttons are violet, focus rings are violet, hardcoded zinc overrides are removed, and list card covers display brand gradients.

**Independent Test**: Landing page background is `rgb(249, 250, 251)`. "Create Your First List" button is `rgb(139, 92, 246)`. Tab through page — focus ring is violet. Dashboard list cards each show a coloured gradient strip.

- [ ] T011 [US2] Replace `bg-zinc-50 dark:bg-black` on the root wrapper `<div>` with `bg-background`; replace `text-black dark:text-white` with `text-foreground` on the hero `<h1>`; replace `text-zinc-600 dark:text-zinc-400` with `text-muted-foreground` on the tagline `<p>`, sub-heading `<p>`, and `<Sparkles>` icon in `src/components/shared/LandingPageClient.tsx`
- [ ] T012 [P] [US2] Import `listCoverGradient` from `@/lib/utils/gradient`; add a `<div>` cover strip (`h-24 w-full rounded-t-[calc(var(--radius)-1px)]` with `style={{ background: listCoverGradient(list.id) }}`) inside `<CardContent>` as the first child, above the existing `<div className="p-4">` body in `src/components/dashboard/ListCard.tsx`

**Checkpoint**: US2 fully functional. Brand colours visible throughout; gradient covers appear on all list cards.

---

## Phase 5: User Story 3 — Brand typography throughout (Priority: P2)

**Goal**: Page headings render in DM Serif Display via the `font-serif` Tailwind utility.

**Independent Test**: Inspect the landing `<h1>` and dashboard `<h1>` in DevTools → Computed → `font-family` starts with `DM Serif Display`.

- [ ] T013 [US3] Add `font-serif` class (alongside existing `font-bold`) to the hero `<h1>` element in `src/components/shared/LandingPageClient.tsx`
- [ ] T014 [P] [US3] Add `font-serif` class (alongside existing `font-bold`) to the `<h1>` element in `src/components/dashboard/DashboardHeader.tsx`

**Checkpoint**: US3 fully functional. Headings render in DM Serif Display across all major views.

---

## Phase 6: User Story 4 — Dark mode uses brand dark palette (Priority: P2)

**Goal**: Dark mode renders `#111827` background, `#1F2937` card surfaces, lavender wordmark — no zinc/pitch-black overrides.

**Independent Test**: Set OS to dark mode. Body background is `rgb(17, 24, 39)`. List card surfaces are `rgb(31, 41, 55)`. Wordmark "faves" span is `rgb(196, 181, 253)`.

- [ ] T015 [US4] Audit `src/components/public/` for any hardcoded `dark:bg-black`, `dark:bg-zinc-*`, or `text-black` classes on container or heading elements; replace with `dark:bg-background`, `bg-background`, or `text-foreground` as appropriate in any public profile/list components that override the token background

**Checkpoint**: US4 fully functional. All four user stories complete. Full brand identity verified in both light and dark modes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tests, final validation, and cleanup.

- [ ] T016 [P] Write component test asserting: (a) wordmark renders `<span>my</span>` and `<span>faves</span>` in DM Serif text, (b) no `MapPin` or "YourFavs" text is present, in `tests/component/Header.test.tsx`
- [ ] T017 [P] Write component test asserting: (a) sidebar wordmark renders `<span>my</span>` and `<span>faves</span>`, (b) no `📍` emoji or "YourFavs" string is present, in `tests/component/DashboardSidebar.test.tsx`
- [ ] T018 Run `pnpm test` — all Vitest unit + component tests must pass; run `pnpm exec playwright test` — all E2E tests must pass; work through the manual checklist in `specs/001-brand-styling/quickstart.md` in a running browser

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup        → No dependencies, start immediately
Phase 2: Foundational → Depends on Phase 1 (T001) — BLOCKS all user stories
Phase 3: US1          → Depends on Phase 2 (T002–T004)
Phase 4: US2          → Depends on Phase 2 (T002–T004) and T001 (gradient utility)
Phase 5: US3          → Depends on Phase 2 (T003 font vars); T013 also depends on T011 (same file)
Phase 6: US4          → Depends on Phase 2 (T002 dark tokens)
Phase 7: Polish       → Depends on all story phases complete
```

### User Story Dependencies

| Story | Depends on | Can parallelise with |
|-------|-----------|----------------------|
| US1 (Phase 3) | Phase 2 complete | US2, US4 (after Phase 2) |
| US2 (Phase 4) | Phase 2 complete + T001 | US1, US3, US4 (after Phase 2) |
| US3 (Phase 5) | Phase 2 complete; T013 depends on T011 | US1, US4 (after Phase 2) |
| US4 (Phase 6) | Phase 2 complete | US1, US2, US3 (after Phase 2) |

### Parallel Opportunities Per Phase

**Phase 2**: T004 (layout.tsx fonts) can run in parallel with T002–T003 (globals.css).

**Phase 3**: T006–T010 are all independent files — all can run in parallel with T005 and each other.

**Phase 4**: T012 (ListCard) is independent of T011 (LandingPageClient) — fully parallel.

**Phase 5**: T014 (DashboardHeader) is independent of T013 (LandingPageClient) — fully parallel. Note T013 modifies the same file as T011 and must run after T011.

**Phase 7**: T016 and T017 are independent test files — fully parallel.

---

## Parallel Example: Phase 3 (US1)

```text
After Phase 2 completes, launch all US1 tasks together:

Task A: T005 → src/components/shared/Header.tsx           (wordmark)
Task B: T006 → src/components/dashboard/DashboardSidebar.tsx (wordmark)
Task C: T007 → src/app/layout.tsx                         (metadata title)
Task D: T008 → src/app/page.tsx                           (metadata title + OG)
Task E: T009 → src/app/profiles/[vanitySlug]/page.tsx     (metadata strings)
Task F: T010 → src/app/profiles/[vanitySlug]/lists/[listSlug]/page.tsx (metadata)

All 6 touch different files — can execute simultaneously.
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete **Phase 1** (T001)
2. Complete **Phase 2** (T002–T004) — required foundation
3. Complete **Phase 3** (T005–T010) — wordmark + metadata
4. **STOP and VALIDATE**: Open app, check all titles read "myfaves", wordmark renders correctly
5. Note: primary buttons will already be violet from T002 (token change)

### Full Incremental Delivery

1. Phase 1 + Phase 2 → Tokens + fonts active (all buttons/colours instantly branded)
2. + Phase 3 (US1) → Wordmarks + metadata correct → **Demo-ready MVP**
3. + Phase 4 (US2) → Cover gradients + zinc-overrides removed → Deploy
4. + Phase 5 (US3) → Serif headings → Deploy
5. + Phase 6 (US4) → Dark mode verified/cleaned up → Deploy
6. + Phase 7 → Tests green → Merge

---

## Summary

| Phase | Tasks | Story | Parallelisable |
|-------|-------|-------|----------------|
| 1 — Setup | T001 | — | No |
| 2 — Foundational | T002–T004 | — | T004 ∥ T002–T003 |
| 3 — US1 (P1) | T005–T010 | US1 | T005–T010 all ∥ |
| 4 — US2 (P1) | T011–T012 | US2 | T012 ∥ T011 |
| 5 — US3 (P2) | T013–T014 | US3 | T014 ∥ T013 |
| 6 — US4 (P2) | T015 | US4 | — |
| 7 — Polish | T016–T018 | — | T016 ∥ T017 |
| **Total** | **18 tasks** | | |
