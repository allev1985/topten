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

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const logLevelDefault =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const envSchema = z.object({
  AUTH_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().trim().min(1),
  DATABASE_URL: z.string().trim().min(1),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_FROM: z.string().default("noreply@myfaves.local"),
  LOG_LEVEL: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      if (trimmed === "") return undefined;
      return trimmed.toLowerCase();
    },
    z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default(logLevelDefault)
  ),
  OTEL_SERVICE_NAME: z.string().default("topten"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_CACHE_TTL_SECONDS: z.coerce.number().default(60),
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

export const config = {
  ...clientConfig,
  authSecret: parsed.data.AUTH_SECRET,
  appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
  db: {
    url: parsed.data.DATABASE_URL,
  },
  googlePlaces: {
    apiKey: parsed.data.GOOGLE_PLACES_API_KEY ?? "",
  },
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    from: parsed.data.SMTP_FROM,
  },
  log: {
    level: parsed.data.LOG_LEVEL as LogLevel,
  },
  otel: {
    serviceName: parsed.data.OTEL_SERVICE_NAME,
    endpoint: parsed.data.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
  cache: {
    redisUrl: parsed.data.REDIS_URL,
    sessionTtlSeconds: parsed.data.SESSION_CACHE_TTL_SECONDS,
  },
} as const;

/**
 * Resolve the application base URL.
 */
export function getAppUrl(requestOrigin?: string | null): string {
  return requestOrigin ?? config.appUrl;
}
