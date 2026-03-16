# YourFavs (TopTen)

A platform that empowers individuals to curate and share personalized collections of their favorite places. Each list is organized around a specific category—such as coffee shops, hiking trails, or restaurants—allowing users to build focused, meaningful lists that reflect their preferences and local expertise.

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd topten

# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env.local

# Start local Supabase (requires Docker)
pnpm supabase:start

# Run database migrations and seed data
pnpm db:push
pnpm db:seed

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Prerequisites

| Requirement | Minimum Version | Check Command      |
| ----------- | --------------- | ------------------ |
| Node.js     | 20.0.0          | `node --version`   |
| pnpm        | 8.0.0           | `pnpm --version`   |
| Docker      | 24.0.0          | `docker --version` |
| Git         | 2.40.0          | `git --version`    |

## Documentation

- **[Quickstart Guide](docs/QUICKSTART.md)** - Detailed setup instructions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture Decisions](docs/decisions/high-level.md)** - Technology choices and rationale

## Available Commands

### Development

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start development server (port 3000) |
| `pnpm build` | Build production bundle              |
| `pnpm start` | Start production server              |

### Database

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `pnpm supabase:start` | Start local Supabase services          |
| `pnpm supabase:stop`  | Stop local Supabase services           |
| `pnpm db:push`        | Push schema changes to database        |
| `pnpm db:seed`        | Seed database with initial data        |
| `pnpm db:studio`      | Open Drizzle Studio (database browser) |

### Code Quality

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm lint`         | Run ESLint                       |
| `pnpm lint:fix`     | Run ESLint with auto-fix         |
| `pnpm format`       | Format code with Prettier        |
| `pnpm format:check` | Check formatting without changes |
| `pnpm typecheck`    | Run TypeScript type checking     |

### Testing

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `pnpm test`          | Run unit tests (Vitest)           |
| `pnpm test:watch`    | Run tests in watch mode           |
| `pnpm test:coverage` | Run tests with coverage report    |
| `pnpm test:e2e`      | Run end-to-end tests (Playwright) |

### Observability (local)

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `pnpm observability:start` | Start local Grafana stack (requires Docker)    |
| `pnpm observability:stop`  | Stop the observability stack                   |
| `pnpm observability:status`| Show running container status                  |

Open [http://localhost:3001](http://localhost:3001) for the Grafana dashboard after starting the stack.

The stack includes:

| Service         | Port | Purpose                                      |
| --------------- | ---- | -------------------------------------------- |
| Grafana         | 3001 | Dashboards — traces, metrics, logs           |
| OTel Collector  | 4318 | OTLP HTTP receiver (app → collector)         |
| Prometheus      | 9090 | Metrics storage                              |
| Grafana Tempo   | 3200 | Distributed trace storage                   |
| Grafana Loki    | 3100 | Log aggregation                              |

The Next.js app exports telemetry via `instrumentation.ts` using the [OpenTelemetry SDK](https://opentelemetry.io/docs/languages/js/). Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` in `.env.local` to connect.

**Log levels** are controlled by `LOG_LEVEL` in `.env.local` (`trace` | `debug` | `info` | `warn` | `error` | `fatal`). Defaults to `debug` in development and `info` in production.

Logs are written as newline-delimited JSON. For human-readable output during development:

```bash
pnpm dev 2>&1 | pnpm pino-pretty
```

## Technology Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js (App Router)                                |
| Database       | Supabase (Postgres)                                 |
| ORM            | Drizzle                                             |
| Auth           | Supabase Auth                                       |
| Styling        | Tailwind CSS + shadcn/ui                            |
| Places API     | Google Places API                                   |
| Logging        | Pino (structured JSON)                              |
| Telemetry      | OpenTelemetry SDK (traces + metrics)                |
| Observability  | Grafana + Tempo + Prometheus + Loki (local Docker)  |
| Testing        | Vitest + React Testing Library + Playwright         |
| Linting        | ESLint + Prettier                                   |
| Local Dev      | Node.js + pnpm + Supabase CLI + Docker              |

## Authentication Architecture

This application uses **Supabase Auth** with a service-based architecture:

- **Auth Service** (`src/lib/auth/service.ts`) - Centralized auth logic
- **Server Actions** (`src/actions/auth-actions.ts`) - Call service directly (no HTTP overhead)
- **Middleware** (`src/middleware.ts`) - Protects routes, manages sessions

See [Authentication Documentation](docs/decisions/authentication.md) for details.

## Project Structure

```
topten/
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   └── api/             # API route handlers
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Auth-related components
│   │   ├── lists/           # List-related components
│   │   └── shared/          # Shared/common components
│   ├── db/                  # Database layer
│   │   ├── schema/          # Drizzle schema definitions
│   │   └── seed/            # Seed data scripts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Shared utilities
│   │   ├── auth/            # Auth helpers and middleware
│   │   ├── config/          # Route configuration
│   │   ├── supabase/        # Supabase client utilities
│   │   └── utils/           # General utilities
│   ├── schemas/             # Zod validation schemas
│   └── types/               # TypeScript types
├── observability/           # Local observability stack config
│   ├── grafana/             # Grafana provisioning (datasources + dashboards)
│   ├── otel-collector/      # OpenTelemetry Collector routing config
│   ├── prometheus/          # Prometheus scrape config
│   ├── tempo/               # Grafana Tempo config
│   └── loki/                # Grafana Loki config
├── supabase/
│   └── migrations/          # Database migrations
├── tests/
│   ├── unit/                # Vitest unit tests
│   ├── integration/         # Integration tests
│   ├── component/           # React Testing Library tests
│   └── e2e/                 # Playwright E2E tests
└── docs/                    # Documentation
```

## License

This project is proprietary. See [LICENSE](LICENSE) for details.
