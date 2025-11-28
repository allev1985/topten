# Quickstart Guide: YourFavs Development Setup

This guide will help you set up the YourFavs development environment from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

| Requirement | Minimum Version | Check Command      |
| ----------- | --------------- | ------------------ |
| Node.js     | 20.0.0          | `node --version`   |
| pnpm        | 8.0.0           | `pnpm --version`   |
| Docker      | 24.0.0          | `docker --version` |
| Git         | 2.40.0          | `git --version`    |

### Installing Prerequisites

**Node.js** (via nvm - recommended):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

**pnpm**:

```bash
npm install -g pnpm
```

**Docker Desktop**:

- macOS/Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Linux: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)

---

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url>
cd topten

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Start local Supabase (Docker must be running)
pnpm supabase:start

# 5. Push database schema
pnpm db:push

# 6. Seed the database
pnpm db:seed

# 7. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Detailed Setup

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd topten
pnpm install
```

This installs all project dependencies including:

- Next.js and React
- Drizzle ORM
- Supabase client
- Tailwind CSS and shadcn/ui
- Testing frameworks (Vitest, Playwright)

### Step 2: Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

The `.env.local` file will be pre-configured for local development. Key variables:

| Variable                        | Description                | Default Value                                             |
| ------------------------------- | -------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase API URL           | `http://localhost:54321`                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key     | Generated on `supabase start`                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key  | Generated on `supabase start`                             |
| `DATABASE_URL`                  | Postgres connection string | `postgresql://postgres:postgres@localhost:54322/postgres` |
| `GOOGLE_PLACES_API_KEY`         | Google Places API key      | Placeholder (optional for setup)                          |

**Note**: After running `pnpm supabase:start`, update the Supabase keys from the terminal output.

### Step 3: Start Local Database

Ensure Docker is running, then start Supabase:

```bash
pnpm supabase:start
```

This starts the following services:

| Service  | URL                            | Description               |
| -------- | ------------------------------ | ------------------------- |
| API      | http://localhost:54321         | Supabase REST/GraphQL API |
| Database | localhost:54322                | PostgreSQL database       |
| Studio   | http://localhost:54323         | Database admin UI         |
| Auth     | http://localhost:54321/auth/v1 | Authentication service    |

**First-time setup**: The command will output API keys. Copy these to your `.env.local` file.

### Step 4: Database Setup

Push the schema to create tables:

```bash
pnpm db:push
```

Seed the database with initial data (categories):

```bash
pnpm db:seed
```

### Step 5: Start Development Server

```bash
pnpm dev
```

The development server starts at [http://localhost:3000](http://localhost:3000).

**Hot Reload**: Changes to files in `src/` are automatically reflected in the browser without manual refresh.

---

## Available Commands

### Development

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start development server (port 3000) |
| `pnpm build` | Build production bundle              |
| `pnpm start` | Start production server              |

### Database

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `pnpm supabase:start`  | Start local Supabase services           |
| `pnpm supabase:stop`   | Stop local Supabase services            |
| `pnpm supabase:status` | Check Supabase service status           |
| `pnpm db:push`         | Push schema changes to database         |
| `pnpm db:generate`     | Generate migrations from schema changes |
| `pnpm db:migrate`      | Run database migrations                 |
| `pnpm db:seed`         | Seed database with initial data         |
| `pnpm db:studio`       | Open Drizzle Studio (database browser)  |

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
| `pnpm test:ui`       | Open Vitest UI                    |
| `pnpm test:e2e`      | Run end-to-end tests (Playwright) |
| `pnpm test:e2e:ui`   | Run E2E tests with Playwright UI  |

---

## Project Structure

```
topten/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── ...
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components
│   ├── db/                  # Database layer
│   │   ├── schema/          # Drizzle schema definitions
│   │   ├── migrations/      # Database migrations
│   │   └── seed/            # Seed data scripts
│   ├── lib/                 # Shared utilities
│   │   ├── supabase/        # Supabase client
│   │   └── utils/           # Helper functions
│   └── types/               # TypeScript types
├── tests/
│   ├── unit/                # Vitest unit tests
│   ├── component/           # React Testing Library tests
│   └── e2e/                 # Playwright E2E tests
├── public/                  # Static assets
├── .env.example             # Environment template
├── .env.local               # Local environment (gitignored)
└── package.json             # Project configuration
```

---

## Next Steps

After completing setup:

1. **Explore the codebase**: Start with `src/app/page.tsx`
2. **Run tests**: `pnpm test` to verify everything works
3. **Open Supabase Studio**: http://localhost:54323 to browse the database
4. **Review the data model**: Check `src/db/schema/` for entity definitions

---

## Getting Help

- Check existing documentation in `docs/` directory
- Review architecture decisions in `docs/decisions/high-level.md`
- For common issues, see [Troubleshooting](TROUBLESHOOTING.md)
