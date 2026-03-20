# myfaves

A platform for curating and sharing personalized collections of favourite places. Each list is focused around a category — coffee shops, hiking trails, restaurants — letting users build meaningful, shareable local expertise.

## Quick Start

### Prerequisites

| Requirement | Minimum version | Check                |
|-------------|-----------------|----------------------|
| Node.js     | 20.x            | `node --version`     |
| pnpm        | 8.x             | `pnpm --version`     |
| Docker      | 24.x            | `docker --version`   |

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` for local dev |
| `DATABASE_URL` | Yes | Default: `postgresql://postgres:postgres@localhost:5432/topten` |
| `GOOGLE_PLACES_API_KEY` | Yes | Server-side only — no `NEXT_PUBLIC_` prefix |
| `SMTP_*` | No | Defaults point to local Mailhog (started with Docker) |

### 3. Start the database and mail server

```bash
pnpm dev:start        # starts Postgres (5432) + Mailhog SMTP (1025)
```

Check containers are running:

```bash
pnpm dev:status
```

### 4. Initialise the database

```bash
pnpm db:migrate       # creates tables from src/db/migrations/0000_init.sql
pnpm db:seed          # optional: seed with sample data
```

### 5. Start the app

```bash
pnpm dev              # http://localhost:3000
```

To inspect emails sent during signup / password reset:

```bash
pnpm dev:email        # opens Mailhog UI at http://localhost:8025
```

---

## Stopping the environment

```bash
pnpm dev:stop         # stops Postgres + Mailhog containers
```

---

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |

### Infrastructure (Docker)

| Command | Description |
|---------|-------------|
| `pnpm dev:start` | Start Postgres + Mailhog |
| `pnpm dev:stop` | Stop containers |
| `pnpm dev:status` | Show running containers |
| `pnpm dev:email` | Open Mailhog UI (http://localhost:8025) |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:migrate` | Run migrations against `DATABASE_URL` |
| `pnpm db:generate` | Generate a new migration from schema changes |
| `pnpm db:seed` | Seed initial data |
| `pnpm db:studio` | Open Drizzle Studio (database browser) |

### Code quality

| Command | Description |
|---------|-------------|
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | All Vitest tests (unit + component + integration) |
| `pnpm test:watch` | Watch mode |
| `pnpm test:coverage` | Coverage report |
| `pnpm test:e2e` | Playwright E2E tests |
| `pnpm test:e2e:ui` | Playwright interactive UI |

### Observability (optional local stack)

| Command | Description |
|---------|-------------|
| `pnpm observability:start` | Start Grafana + Tempo + Prometheus + Loki + OTel Collector |
| `pnpm observability:stop` | Stop the stack |
| `pnpm observability:status` | Show running containers |

Grafana runs at http://localhost:3001. Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` in `.env.local` to connect the app.

For human-readable logs during development:

```bash
pnpm dev 2>&1 | pnpm pino-pretty
```

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Database | PostgreSQL (Docker) |
| ORM | Drizzle |
| Auth | BetterAuth (MIT) |
| Styling | Tailwind CSS + shadcn/ui |
| Places API | Google Places API (server-side only) |
| Logging | Pino (structured JSON) |
| Telemetry | OpenTelemetry SDK |
| Observability | Grafana + Tempo + Prometheus + Loki |
| Testing | Vitest + React Testing Library + Playwright |

## Project structure

```
topten/
├── src/
│   ├── app/              # Next.js App Router pages + /api/auth catch-all
│   ├── actions/          # Server actions (auth-actions.ts etc.)
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui — do not edit directly
│   ├── db/
│   │   ├── schema/       # Drizzle table definitions
│   │   ├── migrations/   # SQL migrations (0000_init.sql)
│   │   └── seed/         # Seed scripts
│   ├── lib/
│   │   ├── auth/         # BetterAuth config + service + helpers
│   │   ├── config/       # Env validation + app constants
│   │   └── services/     # Logging, email, Google Places
│   ├── schemas/          # Zod validation schemas
│   └── types/            # Shared TypeScript types
├── observability/        # Local Grafana stack config
├── tests/
│   ├── unit/
│   ├── component/
│   ├── integration/
│   └── e2e/
└── docs/
    └── decisions/        # Architecture Decision Records
```

## Authentication

Auth uses **BetterAuth** with a service-based architecture — server actions call `src/lib/auth/service.ts` directly, with no HTTP round-trip. Route protection is handled by `src/proxy.ts` (Next.js middleware) via session-cookie presence, with full DB-backed verification in server actions and pages.

See [docs/decisions/authentication.md](docs/decisions/authentication.md) for details.

## License

Proprietary. See [LICENSE](LICENSE).
