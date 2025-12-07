# Implementation Plan: Remove Obsolete Authentication API Routes

**Branch**: `001-remove-obsolete-auth-routes` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-remove-obsolete-auth-routes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This plan details the removal of 7 obsolete authentication API routes that have been superseded by the Auth Service layer. The API routes (`/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/password`, `/api/auth/password/reset`, `/api/auth/session`, `/api/auth/refresh`) will be deleted, while preserving `/api/auth/verify` which is still required for email verification callbacks from Supabase. Documentation will be updated to reflect the new service-based architecture. The technical approach involves careful verification that all Server Actions have been migrated to use the Auth Service directly, comprehensive testing to ensure no regressions, and updating architectural documentation.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14+ (App Router)  
**Primary Dependencies**: Next.js, Supabase (@supabase/ssr, @supabase/supabase-js), Drizzle ORM  
**Storage**: Supabase (PostgreSQL) for user data and sessions  
**Testing**: Vitest (unit), React Testing Library (component), Playwright (E2E)  
**Target Platform**: Web application (Vercel deployment)  
**Project Type**: Web - Next.js App Router with Server Actions and API Routes  
**Performance Goals**: API endpoint response times <200ms for auth operations  
**Constraints**: Must maintain backward compatibility for email verification links; no breaking changes to authentication flow  
**Scale/Scope**: 7 API route files to delete, 1 to preserve, 1 documentation file to update, 1 server action file with API calls to refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅
- **Status**: PASS
- **Rationale**: This is a cleanup task that improves code maintainability by removing obsolete code paths. The Auth Service pattern is already established and provides better separation of concerns.
- **DRY Compliance**: The Auth Service eliminates duplication between API routes and Server Actions. This cleanup enforces DRY by removing the redundant API layer.
- **Framework Code Integrity**: No framework-generated code will be modified. We're only removing application code (API routes).

### II. Testing Discipline & Safety Nets ✅
- **Status**: PASS
- **Rationale**: Existing authentication tests cover the Auth Service and Server Actions. The spec requires all tests to continue passing. Email verification flow (the only remaining API route) will be explicitly tested.
- **Test Coverage**: Current test suite includes:
  - Unit tests for Auth Service functions
  - Integration tests for Server Actions
  - E2E tests for authentication flows
- **Plan**: Run full test suite before and after changes to ensure no regressions.

### III. User Experience Consistency ✅
- **Status**: PASS
- **Rationale**: This is an internal refactoring with no user-facing changes. Email verification flow remains unchanged. All authentication workflows continue to function identically.
- **UX Impact**: Zero - users will not notice any difference in behavior or performance.

### IV. Performance & Resource Efficiency ✅
- **Status**: PASS
- **Rationale**: Removing API routes eliminates unnecessary HTTP overhead. Server Actions calling Auth Service directly is more efficient than Server Actions → API Routes → Auth Service.
- **Performance Impact**: Slight improvement - reduced latency by removing intermediary API layer for most auth operations.

### V. Observability & Debuggability ✅
- **Status**: PASS
- **Rationale**: Auth Service already has comprehensive logging. Removing API routes actually improves observability by having a single code path to monitor.
- **Logging**: All authentication events are logged by the Auth Service with proper error tracking.

### Quality & Delivery Standards ✅
- **Testing Strategy**: Documented in spec (verify email verification works, confirm 404s for deleted routes, validate tests pass)
- **Performance Goals**: Maintains <200ms response times; may improve slightly
- **UX Changes**: None - internal refactoring only
- **Documentation**: Will be updated to reflect service-based architecture

### Conclusion
**All constitution checks PASS. No violations to justify. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-remove-obsolete-auth-routes/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── contracts/           # Phase 1 output (/speckit.plan command)
    └── documentation-updates.md  # Documentation contract
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── auth/
│           ├── login/route.ts          # DELETE (obsolete)
│           ├── logout/route.ts         # DELETE (obsolete)
│           ├── password/
│           │   ├── route.ts            # DELETE (obsolete)
│           │   └── reset/route.ts      # DELETE (obsolete)
│           ├── refresh/route.ts        # DELETE (obsolete)
│           ├── session/route.ts        # DELETE (obsolete)
│           ├── signup/route.ts         # DELETE (obsolete)
│           └── verify/route.ts         # KEEP (required for email verification)
├── actions/
│   └── auth-actions.ts                 # UPDATE (remove API route calls)
└── lib/
    └── auth/
        └── service.ts                   # Reference only (no changes)

docs/
└── decisions/
    └── authentication.md                # UPDATE (document new architecture)

tests/
├── unit/                                # Validate all pass
├── integration/                         # Validate all pass
└── e2e/                                 # Validate all pass
```

**Structure Decision**: Web application with Next.js App Router. Uses Server Actions for form submissions and API routes only where absolutely necessary (email verification callback from Supabase). The cleanup removes the obsolete three-layer architecture (UI → Server Actions → API Routes → Auth Service → Supabase) in favor of the streamlined two-layer architecture (UI → Server Actions → Auth Service → Supabase), with the exception of email verification which requires an API route for external callback (Supabase email links → API Route → Auth Service).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No complexity violations** - All constitution checks passed. This is a straightforward cleanup task with no architectural complexity to justify.

---

## Phase 0: Outline & Research

### Research Objectives

This phase focuses on validating assumptions and understanding the current state before making changes.

#### Research Task 1: Verify Server Actions Migration Status
**Question**: Have all Server Actions been fully migrated from calling API routes to using the Auth Service directly?

**Investigation Points**:
1. Search codebase for any remaining API route calls (`/api/auth/`) in server actions
2. Verify that `src/actions/auth-actions.ts` only calls Auth Service or has explicit TODO markers
3. Check for any other server-side code that might call the API routes
4. Document any remaining API route dependencies

**Expected Finding**: Most Server Actions should be using Auth Service directly. Some may still call API routes as an interim state. Document all remaining uses.

**Deliverable**: Catalog of all API route usage in the codebase with file paths and line numbers.

---

#### Research Task 2: Analyze Test Coverage for Authentication
**Question**: What test coverage exists for authentication flows, and will it catch regressions from removing API routes?

**Investigation Points**:
1. Identify all test files related to authentication
2. Map tests to functionality (signup, login, logout, password reset, etc.)
3. Determine if tests exercise Auth Service directly or via API routes
4. Check for E2E tests that verify email verification flow
5. Identify gaps in test coverage

**Expected Finding**: Tests should primarily test Server Actions and Auth Service. API route tests may exist but should be redundant.

**Deliverable**: Test coverage matrix showing which authentication features are tested and at what level (unit/integration/E2E).

---

#### Research Task 3: Document Email Verification Flow Dependencies
**Question**: What are the exact dependencies on `/api/auth/verify` and why must it remain?

**Investigation Points**:
1. Examine `/api/auth/verify/route.ts` implementation
2. Check Supabase email template configuration
3. Verify how Supabase email links are constructed (callback URL)
4. Understand both OTP and PKCE verification flows
5. Confirm no other API routes are called from external sources

**Expected Finding**: Email verification requires an API route because Supabase email links need a public HTTP endpoint to callback to. This cannot be replaced with a Server Action.

**Deliverable**: Technical diagram of email verification flow showing Supabase → API Route → Redirect flow.

---

#### Research Task 4: Identify Potential Breaking Changes
**Question**: Could removing these API routes break any integrations, bookmarks, or external references?

**Investigation Points**:
1. Search for hardcoded API route URLs in frontend code
2. Check if any external documentation references the API endpoints
3. Verify mobile apps or other clients don't call these endpoints
4. Review Git history to see if API routes were ever publicly documented
5. Check for any monitoring/logging that references specific endpoints

**Expected Finding**: API routes were only used internally by Server Actions. No external integrations should exist.

**Deliverable**: List of any discovered external references or confirmation that none exist.

---

#### Research Task 5: Best Practices for API Route Deprecation in Next.js
**Question**: What are the recommended patterns for safely removing API routes in a Next.js application?

**Investigation Points**:
1. Research Next.js documentation on deprecating API routes
2. Find community best practices for backward compatibility
3. Consider if we should return 410 Gone instead of 404 Not Found
4. Evaluate if we need a deprecation period with warning responses
5. Understand deployment considerations (rolling deployments, caching)

**Expected Finding**: Since these are internal-only routes, immediate deletion is acceptable. For public APIs, 410 Gone with deprecation notice would be preferred.

**Deliverable**: Recommended approach for removing routes (immediate deletion vs graceful deprecation).

---

### Research Output

**Document**: `specs/001-remove-obsolete-auth-routes/research.md`

**Contents**:
1. Current State Analysis
   - API Route Usage Catalog
   - Server Action Migration Status
   - External Dependencies Assessment
2. Test Coverage Analysis
   - Current Test Matrix
   - Gap Analysis
   - Testing Strategy for Validation
3. Email Verification Flow Documentation
   - Technical Diagram
   - Why API Route is Required
   - Supabase Configuration Details
4. Risk Assessment
   - Breaking Change Potential
   - Mitigation Strategies
5. Removal Strategy
   - Recommended Approach
   - Deployment Considerations
   - Rollback Plan

**Success Criteria**: All research questions answered with evidence. No "NEEDS CLARIFICATION" items remaining.

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all questions answered.

### Design Deliverables

#### 1. Data Model Analysis (`data-model.md`)

**Purpose**: Document any data structure changes (there should be none for this cleanup).

**Contents**:
- **Entities**: None - no database schema changes
- **API Response Formats**: Document that Server Actions return the same data as API routes did
- **Type Definitions**: Verify TypeScript types remain consistent
- **Migration Impact**: None - this is code deletion only

**Expected Outcome**: Confirmation that no data model changes are required. Server Actions already use the same Auth Service types that API routes used internally.

---

#### 2. Contract Definitions (`contracts/documentation-updates.md`)

**Purpose**: Define the contract for updated documentation to ensure accuracy and completeness.

**Contents**:

##### Documentation Update Contract

**File**: `docs/decisions/authentication.md`

**Required Changes**:
1. **API Architecture Section** (around line 1032)
   - **Before**: Describes three-layer architecture with API routes
   - **After**: Describes two-layer architecture (UI → Server Actions → Auth Service → Supabase)
   - **Exception**: Document that `/api/auth/verify` remains for email verification callbacks

2. **Removed Routes Section** (new)
   - List all 7 removed routes
   - Map each to its Auth Service replacement
   - Explain why they were removed (redundant layer)

3. **Historical Reference Section** (new)
   - Preserve old architecture description for context
   - Mark clearly as "Legacy (Removed 2025-12-07)"
   - Explain the migration timeline

4. **Email Verification Section** (update existing)
   - Clarify that `/api/auth/verify` is the only API route
   - Explain why it must remain (external callback requirement)
   - Document both OTP and PKCE flows

**Acceptance Criteria**:
- Developers reading the docs understand current architecture (no API routes except verify)
- Historical context is preserved for reference
- Migration rationale is clear
- All removed routes are documented with their replacements

---

#### 3. Quickstart Guide (`quickstart.md`)

**Purpose**: Provide step-by-step instructions for implementing and validating the changes.

**Contents**:

##### Implementation Quickstart

**Step 1: Pre-flight Checks**
```bash
# Verify current test suite passes
pnpm test

# Search for API route references
grep -r "/api/auth/" src --exclude-dir=api
```

**Step 2: Update Server Actions**
```bash
# Review auth-actions.ts for remaining API calls
# Replace API route calls with Auth Service calls where needed
```

**Step 3: Delete Obsolete API Routes**
```bash
# Delete 7 route files (preserve verify)
rm src/app/api/auth/login/route.ts
rm src/app/api/auth/logout/route.ts
rm src/app/api/auth/signup/route.ts
rm src/app/api/auth/session/route.ts
rm src/app/api/auth/refresh/route.ts
rm src/app/api/auth/password/route.ts
rm -r src/app/api/auth/password/reset/
```

**Step 4: Update Documentation**
```bash
# Edit docs/decisions/authentication.md
# Follow documentation-updates.md contract
```

**Step 5: Validation**
```bash
# Run test suite
pnpm test

# Test email verification
pnpm dev
# Register new account
# Click verification email link
# Verify redirect to dashboard

# Test deleted routes return 404
curl http://localhost:3000/api/auth/login
# Should return 404
```

**Step 6: Final Review**
```bash
# Search for broken references
grep -r "/api/auth/" src --exclude-dir=api
# Should only find references to /api/auth/verify

# Commit changes
git add .
git commit -m "Remove obsolete auth API routes"
```

---

#### 4. Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh copilot`

**Purpose**: Update agent-specific context files with changes from this implementation.

**Expected Updates**:
- Document that API routes are removed (except verify)
- Note that Server Actions use Auth Service directly
- Update authentication flow diagrams
- Preserve manual additions between markers

---

### Phase 1 Success Criteria

- `data-model.md` confirms no schema changes required
- `contracts/documentation-updates.md` provides clear contract for docs
- `quickstart.md` provides executable implementation steps
- Agent context updated with new architecture information
- **Constitution Re-check**: All gates still PASS (no design complexity added)

---

## Phase 2: Task Breakdown & Implementation Planning

**Note**: This phase is executed by the `/speckit.tasks` command, NOT by `/speckit.plan`.

**Output**: `specs/001-remove-obsolete-auth-routes/tasks.md`

**Expected Task Structure** (preview only - actual tasks created in Phase 2):

### Task Categories

1. **Preparation Tasks**
   - Run pre-flight tests
   - Document current API route usage
   - Create backup branch

2. **Code Modification Tasks**
   - Update Server Actions to remove API route calls
   - Delete obsolete API route files
   - Validate `/api/auth/verify` remains intact

3. **Documentation Tasks**
   - Update `docs/decisions/authentication.md`
   - Add migration notes
   - Update README if needed

4. **Testing & Validation Tasks**
   - Run full test suite
   - Manual test email verification flow
   - Verify 404 responses for deleted routes
   - Check for broken references

5. **Deployment Tasks**
   - Code review checklist
   - Deployment notes
   - Rollback procedure

**Task Size**: Each task should be <600 lines of code or <2 hours of work.

**Dependencies**: Tasks ordered by dependency chain (preparation → modification → documentation → validation).

---

## Implementation Roadmap

### Timeline Estimate

- **Phase 0 (Research)**: 4-6 hours
  - Codebase analysis
  - Test coverage review
  - Documentation of current state

- **Phase 1 (Design)**: 2-3 hours
  - Data model analysis (minimal)
  - Contract definitions
  - Quickstart guide creation

- **Phase 2 (Task Planning)**: 1-2 hours
  - Breaking work into tasks
  - Dependency mapping
  - Creating tasks.md

- **Implementation**: 6-8 hours
  - Code changes (2-3 hours)
  - Documentation updates (2 hours)
  - Testing & validation (2-3 hours)

**Total Estimate**: 13-19 hours (approximately 2-3 work days)

### Risk Mitigation

**Risk 1**: Breaking email verification flow
- **Mitigation**: Explicit testing of verify endpoint before and after
- **Rollback**: Keep verify route unchanged; easy to restore deleted routes

**Risk 2**: Undiscovered API route dependencies
- **Mitigation**: Comprehensive search in research phase
- **Rollback**: Git revert; routes can be restored in minutes

**Risk 3**: Test failures after deletion
- **Mitigation**: Run tests before and after; identify failures immediately
- **Rollback**: Restore routes or fix tests based on failure type

### Deployment Strategy

1. **Merge to main**: After all tests pass and code review approved
2. **Deploy to staging**: Validate email verification works
3. **Deploy to production**: Low risk - internal refactoring only
4. **Monitor**: Watch error logs for unexpected 404s on auth endpoints

**Rollback Procedure**: If issues discovered post-deployment, restore deleted route files from Git history and redeploy. No data migration required.

---

## Appendices

### Appendix A: API Route to Auth Service Mapping

| Deleted Route | Auth Service Function | Server Action |
|--------------|---------------------|---------------|
| `POST /api/auth/signup` | `signup()` | `signupAction()` |
| `POST /api/auth/login` | Direct Supabase call in action | `loginAction()` |
| `POST /api/auth/logout` | `logout()` | `signOutAction()` |
| `POST /api/auth/refresh` | `refreshSession()` | N/A (middleware) |
| `PUT /api/auth/password` | `updatePassword()` | `passwordUpdateAction()` |
| `POST /api/auth/password/reset` | `resetPassword()` | `passwordResetRequestAction()` |
| `GET /api/auth/session` | `getSession()` | N/A (middleware) |

**Preserved Route**:
- `GET /api/auth/verify` - Required for Supabase email callback (no Auth Service equivalent)

### Appendix B: Related Decision Records

- `docs/decisions/authentication.md` - Primary authentication architecture documentation
- `docs/decisions/high-level.md` - May reference authentication system
- `.specify/memory/constitution.md` - Code quality standards applied to this work

### Appendix C: Testing Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Email verification flow works end-to-end
- [ ] Deleted routes return 404
- [ ] No broken references in codebase
- [ ] Documentation accurately reflects new architecture
- [ ] Server Actions function correctly without API routes

---

**End of Implementation Plan**

**Next Steps**:
1. Proceed to Phase 0: Execute research tasks and create `research.md`
2. After research complete: Execute Phase 1 design tasks
3. After design complete: Run `/speckit.tasks` to create `tasks.md` and begin implementation
