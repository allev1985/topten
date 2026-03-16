export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: readonly LogLevel[] = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

export type EnvConfig = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  GOOGLE_PLACES_API_KEY?: string;
  LOG_LEVEL: LogLevel;
  OTEL_SERVICE_NAME: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please check your .env.local file or environment configuration.`
    );
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

function getLogLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (!raw) {
    return process.env.NODE_ENV === "production" ? "info" : "debug";
  }
  if (!(LOG_LEVELS as readonly string[]).includes(raw)) {
    throw new Error(
      `Invalid LOG_LEVEL "${raw}". Must be one of: ${LOG_LEVELS.join(", ")}`
    );
  }
  return raw as LogLevel;
}

export function validateEnv(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    DATABASE_URL: getRequiredEnv("DATABASE_URL"),
    GOOGLE_PLACES_API_KEY: getOptionalEnv("GOOGLE_PLACES_API_KEY"),
    LOG_LEVEL: getLogLevel(),
    OTEL_SERVICE_NAME: getOptionalEnv("OTEL_SERVICE_NAME") ?? "topten",
    OTEL_EXPORTER_OTLP_ENDPOINT: getOptionalEnv("OTEL_EXPORTER_OTLP_ENDPOINT"),
  };
}

// Lazy-loaded config that validates on first access
let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
