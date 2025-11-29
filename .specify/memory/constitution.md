<!-- Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - I. Code Quality & Maintainability → expanded with explicit DRY principle
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (no changes needed)
  - ✅ .specify/templates/spec-template.md (no changes needed)
  - ✅ .specify/templates/tasks-template.md (no changes needed)
  - ✅ .specify/templates/agent-file-template.md (no changes needed)
  - ✅ .specify/templates/checklist-template.md (no changes needed)
- Follow-up TODOs: none
-->

# TopTen Constitution

## Core Principles

### I. Code Quality & Maintainability (NON-NEGOTIABLE)

Code written for TopTen MUST be simple, readable, and maintainable by any
contributor familiar with the language. Every module MUST have a clear,
single responsibility, avoid unnecessary abstraction, and follow the
project's chosen style and linting rules.

**DRY (Don't Repeat Yourself)**: Duplicated logic or code patterns MUST be
extracted into reusable modules, utilities, or shared components. Before
implementing any functionality, contributors MUST check whether similar
logic already exists and MUST reuse or extend it. When duplication is
unavoidable (e.g., due to platform constraints or explicit design trade-offs),
it MUST be explicitly justified in documentation or code comments linked to
the relevant decision records.

Complexity or non-obvious behavior MUST be explicitly justified in
documentation or code comments linked to the relevant decision records.

**Rationale**: High code quality and adherence to DRY reduce defects,
minimize maintenance burden, accelerate onboarding, and make iterative
change safe and predictable.

### II. Testing Discipline & Safety Nets (NON-NEGOTIABLE)

All user-facing behavior and critical logic MUST be covered by automated
tests. For each change, tests MUST be written or updated before or
alongside implementation, and the full test suite MUST pass before
merge. Reproduced bugs MUST include a failing test before the fix.
Critical paths MUST have unit, integration, and where applicable
contract-level tests.

**Rationale**: Strong tests provide confidence to refactor, prevent
regressions, and document expected behavior.

### III. User Experience Consistency

User-facing flows MUST feel consistent across the project. Terminology,
interaction patterns, and visual structure (where applicable) SHOULD
match across similar screens and commands. Breaking changes to the user
experience (CLI flags, output formats, navigation) MUST be deliberate,
communicated, and, when possible, backward compatible or gated by
configuration.

**Rationale**: Consistency reduces user confusion, lowers support cost,
and builds trust in the tool.

### IV. Performance & Resource Efficiency

Features MUST be designed to meet clearly defined performance targets
appropriate to their scope (e.g., latency, throughput, memory
usage). Baseline performance expectations MUST be captured in plan and
spec documents before heavy implementation. Changes that materially
impact performance MUST be measured with repeatable benchmarks or
metrics, and optimizations MUST preserve correctness and clarity.

**Rationale**: Predictable performance ensures TopTen remains reliable
and responsive as usage grows.

### V. Observability & Debuggability

The system MUST provide enough logging, metrics, and diagnostics to
understand behavior in development and production-like environments.
Logs MUST be structured where feasible and avoid leaking sensitive data.
Errors MUST surface actionable messages for both users and developers,
including remediation hints when possible.

**Rationale**: Good observability shortens debugging cycles and makes
performance and reliability work practical.

## Quality & Delivery Standards

TopTen work MUST respect the following cross-cutting standards:

- Every feature plan MUST document testing strategy, performance goals,
  and any deliberate UX changes.
- Specifications MUST define testable acceptance criteria for each user
  story, including clear success and failure states.
- Tasks MUST be traceable to user stories and principles (quality,
  testing, UX, performance) they enforce.

## Delivery Workflow & Review Gates

- No code MAY be merged to main without:
  - Passing tests for impacted areas.
  - Code review that explicitly checks against the Core Principles.
  - Updated documentation where behavior, UX, or performance contracts
    change.
- Risky changes (schema changes, public API changes, major UX shifts)
  MUST reference a decision record in `docs/decisions/` or equivalent.

## Governance

The TopTen Constitution supersedes informal practices and individual
preferences when they conflict. All contributors are responsible for
understanding and applying these principles.

- **Amendments**: Any proposal to change principles or governance MUST
  be documented, reviewed, and approved via standard code review. The
  Sync Impact Report at the top of this file MUST be updated with the
  version bump, affected sections, and TODOs.
- **Versioning**: Constitution versions follow semantic versioning:
  - MAJOR: Breaking changes to principles or governance.
  - MINOR: New principles or material expansions.
  - PATCH: Clarifications that do not change expected behavior.
- **Compliance Review**: Feature plans, specs, and task lists MUST
  include an explicit "Constitution Check" step verifying alignment with
  code quality, testing, UX, and performance requirements.

**Version**: 1.1.0 | **Ratified**: 2025-11-28 | **Last Amended**: 2025-11-29
