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

## Technology Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js (App Router)                        |
| Database   | Supabase (Postgres)                         |
| ORM        | Drizzle                                     |
| Auth       | Supabase Auth                               |
| Styling    | Tailwind CSS + shadcn/ui                    |
| Places API | Google Places API                           |
| Testing    | Vitest + React Testing Library + Playwright |
| Linting    | ESLint + Prettier                           |
| Local Dev  | Node.js + pnpm + Supabase CLI + Docker      |

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
