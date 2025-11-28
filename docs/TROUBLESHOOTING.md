# Troubleshooting Guide

This guide covers common issues you might encounter while developing YourFavs.

## Docker Issues

### Error: "Cannot connect to the Docker daemon"

**Symptom**: Running `pnpm supabase:start` fails with Docker connection error.

**Solution**:

```bash
# Check if Docker is running
docker info

# On macOS/Windows: Start Docker Desktop from the applications menu

# On Linux:
sudo systemctl start docker

# Verify Docker is running
docker ps
```

### Error: "Port already in use"

**Symptom**: Supabase or Next.js fails to start because a port is occupied.

**Solution**:

```bash
# Check what's using the port
lsof -i :3000    # Next.js
lsof -i :54321   # Supabase API
lsof -i :54322   # Supabase Database
lsof -i :54323   # Supabase Studio

# Kill the process
kill -9 <PID>

# Or stop all Supabase containers
pnpm supabase:stop
```

### Error: "Docker container not starting"

**Symptom**: Supabase containers fail to start properly.

**Solution**:

```bash
# Check container status
docker ps -a

# View container logs
docker logs <container_id>

# Reset Supabase completely
pnpm supabase:stop
docker system prune -f
pnpm supabase:start
```

---

## Database Issues

### Error: "Connection refused to database"

**Symptom**: Database commands fail with connection errors.

**Solution**:

```bash
# Check Supabase status
pnpm supabase:status

# Restart Supabase
pnpm supabase:stop
pnpm supabase:start
```

### Error: "Migration failed"

**Symptom**: `pnpm db:migrate` fails with SQL errors.

**Solution**:

```bash
# Check the migration files for syntax errors
ls -la src/db/migrations/

# View migration contents
cat src/db/migrations/<migration-file>.sql

# Try pushing schema directly (development only)
pnpm db:push
```

### Error: "Seed failed"

**Symptom**: `pnpm db:seed` fails.

**Solution**:

```bash
# Check database connection
pnpm db:studio

# Ensure tables exist first
pnpm db:push

# Then seed
pnpm db:seed
```

### Resetting the Database

**Warning**: This destroys all local data.

```bash
# Stop Supabase
pnpm supabase:stop

# Start fresh
pnpm supabase:start

# Recreate tables
pnpm db:push

# Reseed data
pnpm db:seed
```

---

## Node.js Issues

### Error: "Node version mismatch"

**Symptom**: Commands fail due to incompatible Node.js version.

**Solution**:

```bash
# Check current version
node --version

# If using nvm, switch to correct version
nvm use 20

# Or install the correct version
nvm install 20

# Reinstall dependencies after switching
rm -rf node_modules
pnpm install
```

### Error: "pnpm not found"

**Symptom**: Terminal cannot find pnpm command.

**Solution**:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Error: "Module not found"

**Symptom**: Import errors when running the application.

**Solution**:

```bash
# Clean install dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## Environment Issues

### Error: "Missing environment variable"

**Symptom**: Application fails to start with "Missing environment variable" error.

**Solution**:

1. Ensure `.env.local` exists:

   ```bash
   cp .env.example .env.local
   ```

2. Verify Supabase keys are set from `pnpm supabase:start` output:

   ```bash
   pnpm supabase:status
   ```

3. Copy the displayed API URL, anon key, and service role key to `.env.local`

### Error: "Invalid Supabase URL/Key"

**Symptom**: Supabase client errors about invalid credentials.

**Solution**:

1. Restart Supabase to get fresh keys:

   ```bash
   pnpm supabase:stop
   pnpm supabase:start
   ```

2. Update `.env.local` with the new keys from the output

---

## Build & Lint Issues

### Error: "ESLint errors"

**Symptom**: `pnpm lint` reports errors.

**Solution**:

```bash
# Auto-fix fixable issues
pnpm lint:fix

# Format code
pnpm format
```

### Error: "TypeScript errors"

**Symptom**: `pnpm typecheck` or `pnpm build` reports type errors.

**Solution**:

```bash
# Check specific errors
pnpm typecheck

# Common fixes:
# 1. Ensure all imports are correct
# 2. Check for missing type definitions
# 3. Install missing @types packages if needed
```

### Error: "Build failed"

**Symptom**: `pnpm build` fails.

**Solution**:

```bash
# Clear Next.js cache
rm -rf .next

# Check for type errors
pnpm typecheck

# Check for lint errors
pnpm lint

# Try building again
pnpm build
```

---

## Test Issues

### Error: "Vitest tests failing"

**Symptom**: `pnpm test` shows failures.

**Solution**:

```bash
# Run tests in watch mode to see details
pnpm test:watch

# Check test setup
cat tests/setup.ts
```

### Error: "Playwright tests timing out"

**Symptom**: `pnpm test:e2e` times out waiting for the server.

**Solution**:

```bash
# Ensure dev server starts correctly
pnpm dev

# Check if port 3000 is available
lsof -i :3000

# Run with debug mode
DEBUG=pw:webserver pnpm test:e2e
```

---

## Getting More Help

If you're still stuck:

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Check the [Supabase documentation](https://supabase.com/docs)
3. Check the [Drizzle ORM documentation](https://orm.drizzle.team/docs)
4. Review error messages carefully - they often contain the solution
5. Search existing issues in the repository
