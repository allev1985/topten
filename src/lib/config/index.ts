/**
 * Server configuration — single source of truth for all config.
 *
 * Environment variables are validated against a Zod schema at module load
 * and merged with the shared client constants. All server modules import
 * from here; client components import from `@/lib/config/client` instead.
 */

import "server-only";
import { z } from "zod";
import { config as clientConfig } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// ---------------------------------------------------------------------------
// Env schema
// ---------------------------------------------------------------------------

const logLevelDefault =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
  DATABASE_URL: z.string().trim().min(1),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  LOG_LEVEL: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      if (trimmed === "") return undefined;
      return trimmed.toLowerCase();
    },
    z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default(
      logLevelDefault
    )
  ),
  OTEL_SERVICE_NAME: z.string().default("topten"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment configuration:\n${issues}\n` +
      `Please check your .env.local file or environment configuration.`
  );
}

// ---------------------------------------------------------------------------
// Config object
// ---------------------------------------------------------------------------

export const config = {
  ...clientConfig,
  supabase: {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  },
  db: {
    url: parsed.data.DATABASE_URL,
  },
  googlePlaces: {
    apiKey: parsed.data.GOOGLE_PLACES_API_KEY ?? "",
  },
  log: {
    level: parsed.data.LOG_LEVEL as LogLevel,
  },
  otel: {
    serviceName: parsed.data.OTEL_SERVICE_NAME,
    endpoint: parsed.data.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
} as const;

// ---------------------------------------------------------------------------
// Utilities that depend on runtime context (not pure config values)
// ---------------------------------------------------------------------------

/**
 * Resolve the application base URL.
 * Prefers the request origin (from headers) over the static env var.
 */
export function getAppUrl(requestOrigin?: string | null): string {
  return requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
}
