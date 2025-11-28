# Research: Local Development Environment Setup

**Feature**: 001-local-dev-setup | **Date**: 2025-11-28

## Research Questions

### 1. Next.js 14+ App Router Best Practices

**Context**: Setting up a new Next.js project with App Router for server-side rendering and server components.

**Decision**: Use `create-next-app` with TypeScript, App Router, ESLint, Tailwind CSS, and `src/` directory enabled.

**Rationale**:

- Official scaffolding tool ensures best practices are followed
- App Router is the recommended architecture for new Next.js projects
- Built-in TypeScript support with strict mode
- Native Tailwind CSS integration reduces configuration overhead

**Alternatives Considered**:

- Manual setup: Rejected due to higher error potential and maintenance burden
- Pages Router: Rejected as it's the legacy pattern; App Router is the future direction

**Configuration Settings**:

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

---

### 2. Supabase Local Development with Docker

**Context**: Need a local database that mirrors production Supabase setup.

**Decision**: Use Supabase CLI with `supabase init` and `supabase start` for local development.

**Rationale**:

- Official Supabase approach ensures compatibility with production
- Includes local Auth, Postgres, Storage, and Edge Functions
- Docker Compose managed by Supabase CLI simplifies operations
- Default ports: API on 54321, DB on 54322, Studio on 54323

**Alternatives Considered**:

- Plain Docker Postgres: Rejected due to missing Supabase Auth integration
- Supabase cloud for dev: Rejected due to cost and shared environment risks

**Setup Steps**:

1. `pnpm add -D supabase`
2. `npx supabase init`
3. `npx supabase start`

**Environment Variables Required**:

- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<generated-anon-key>`
- `SUPABASE_SERVICE_ROLE_KEY=<generated-service-key>`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres`

---

### 3. Drizzle ORM Configuration for Supabase/Postgres

**Context**: Need type-safe database operations with migration support.

**Decision**: Use Drizzle ORM with `drizzle-kit` for migrations and `drizzle-orm/postgres-js` driver.

**Rationale**:

- Excellent TypeScript inference for schema and queries
- Lightweight compared to Prisma (~10KB vs ~2MB)
- First-class support for Postgres and Supabase
- Migration generation from schema changes

**Alternatives Considered**:

- Prisma: Rejected due to larger bundle size and slower cold starts
- Kysely: Rejected due to less mature migration tooling
- Direct SQL: Rejected due to lack of type safety

**Dependencies**:

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

**Configuration** (`drizzle.config.ts`):

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

### 4. shadcn/ui Setup and Component Strategy

**Context**: Need a consistent UI component library that integrates with Tailwind CSS.

**Decision**: Use shadcn/ui with the default style and initialize with `npx shadcn-ui@latest init`.

**Rationale**:

- Components are copied into project, giving full control
- Built on Radix UI primitives for accessibility
- Tailwind CSS native, no CSS-in-JS overhead
- Easy to customize and extend

**Alternatives Considered**:

- Radix primitives only: Rejected due to more initial styling work
- Material UI: Rejected due to larger bundle and different design system
- Headless UI: Rejected due to less comprehensive component set

**Setup Steps**:

1. `npx shadcn-ui@latest init`
2. Configure `components.json` with aliases
3. Add components as needed: `npx shadcn-ui@latest add button`

---

### 5. Testing Framework Configuration

**Context**: Need unit, component, and E2E testing capabilities.

**Decision**: Use Vitest for unit/component tests with React Testing Library, and Playwright for E2E.

**Rationale**:

- Vitest: Fast, Vite-native, excellent TypeScript support, Jest-compatible API
- React Testing Library: Standard for testing React components
- Playwright: Cross-browser E2E testing with excellent DX

**Alternatives Considered**:

- Jest: Rejected due to slower performance compared to Vitest
- Cypress: Rejected in favor of Playwright's cross-browser support
- Testing Library only: E2E coverage still needed

**Dependencies**:

```bash
# Unit/Component testing
pnpm add -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react

# E2E testing
pnpm add -D @playwright/test
npx playwright install
```

**Configuration Files**:

- `vitest.config.ts`: Configure test environment, coverage, and paths
- `playwright.config.ts`: Configure browser targets and test directory

---

### 6. ESLint and Prettier Configuration

**Context**: Need consistent code style and linting rules.

**Decision**: Extend Next.js ESLint config with Prettier integration.

**Rationale**:

- Next.js provides optimized ESLint rules for React and Next.js patterns
- Prettier for consistent formatting across team
- ESLint-Prettier integration prevents conflicts

**Dependencies**:

```bash
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Configuration**:

- Extend `next/core-web-vitals` for Next.js-specific rules
- Add Prettier plugin to ESLint
- Create `.prettierrc` for formatting options

---

### 7. Node.js Version Management

**Context**: Ensure consistent Node.js version across developer machines.

**Decision**: Require Node.js 20+ LTS with version specification in `package.json` engines field.

**Rationale**:

- Node.js 20 is current LTS with long-term support until April 2026
- Required for modern Next.js features and dependencies
- Engines field provides clear version requirements

**Configuration** (`package.json`):

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**Additional**: Add `.nvmrc` file with `20` for nvm users.

---

### 8. Environment Variable Validation

**Context**: Prevent runtime errors from missing environment variables.

**Decision**: Use environment variable validation at application startup.

**Rationale**:

- Catches missing configuration early
- Provides clear error messages for developers
- Documents required variables through validation schema

**Approach**:

- Create `src/lib/env.ts` with validation logic
- Check required variables on server startup
- Provide helpful error messages with variable names

---

## Summary of Dependencies

### Production Dependencies

- `next`: ^14.0.0
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `drizzle-orm`: ^0.29.0
- `postgres`: ^3.4.0
- `@supabase/supabase-js`: ^2.39.0

### Development Dependencies

- `typescript`: ^5.3.0
- `@types/node`: ^20.0.0
- `@types/react`: ^18.2.0
- `@types/react-dom`: ^18.2.0
- `drizzle-kit`: ^0.20.0
- `supabase`: ^1.120.0
- `tailwindcss`: ^3.4.0
- `postcss`: ^8.4.0
- `autoprefixer`: ^10.4.0
- `eslint`: ^8.56.0
- `eslint-config-next`: ^14.0.0
- `prettier`: ^3.2.0
- `vitest`: ^1.2.0
- `@testing-library/react`: ^14.1.0
- `@testing-library/dom`: ^9.3.0
- `jsdom`: ^24.0.0
- `@vitejs/plugin-react`: ^4.2.0
- `@playwright/test`: ^1.41.0

---

## Resolved Questions

| Question              | Resolution                                    |
| --------------------- | --------------------------------------------- |
| Package manager       | pnpm (per architecture doc)                   |
| Node.js version       | 20+ LTS                                       |
| Database driver       | postgres.js via drizzle-orm                   |
| Local database ports  | 54321 (API), 54322 (DB), 54323 (Studio)       |
| UI component approach | shadcn/ui with Radix primitives               |
| Test runner           | Vitest for unit/component, Playwright for E2E |
| Code style            | ESLint + Prettier with Next.js config         |
