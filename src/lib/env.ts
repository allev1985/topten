export type EnvConfig = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  GOOGLE_PLACES_API_KEY?: string;
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

export function validateEnv(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    DATABASE_URL: getRequiredEnv("DATABASE_URL"),
    GOOGLE_PLACES_API_KEY: getOptionalEnv("GOOGLE_PLACES_API_KEY"),
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
