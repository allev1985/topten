/**
 * Structured logging service
 *
 * Wraps pino with a consistent schema and automatic context injection
 * (userId, sessionId from AsyncLocalStorage; traceId/spanId from the
 * active OpenTelemetry span).
 *
 * Log level semantics:
 *   trace  — method entry/exit, every DB call parameter
 *   debug  — intermediate state, computed values, dev-only detail
 *   info   — user-initiated actions, successful state transitions
 *   warn   — recoverable failures, degraded operation, fallbacks used
 *   error  — thrown errors, failed operations requiring attention
 *   fatal  — process-level failures
 *
 * Usage:
 *   const log = createServiceLogger("list-service");
 *   log.info({ method: "createList", userId }, "List created");
 *   log.error({ method: "createList", error }, "Failed to create list");
 */

import pino from "pino";
import { LOG_LEVEL } from "@/lib/config";
import { getLogContext } from "./context";

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface LogFields {
  /** The service name — bound at logger creation */
  service?: string;
  /** The method or operation name */
  method?: string;
  /** Authenticated user id */
  userId?: string;
  /** Supabase session id */
  sessionId?: string;
  /** Incoming request id */
  requestId?: string;
  /** List entity id */
  listId?: string;
  /** Place entity id */
  placeId?: string;
  /** Operation duration in milliseconds */
  durationMs?: number;
  /** OpenTelemetry trace id (injected automatically) */
  traceId?: string;
  /** OpenTelemetry span id (injected automatically) */
  spanId?: string;
  /** Serialised error (use the `err` pino standard key for stack traces) */
  err?: unknown;
  /** Any additional structured fields */
  [key: string]: unknown;
}

// ─── OTel span correlation ────────────────────────────────────────────────────

function getActiveSpanIds(): { traceId?: string; spanId?: string } {
  try {
    // Lazily require so the logger still works if OTel is not initialised
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { trace, isValidTraceId, isValidSpanId } =
      require("@opentelemetry/api") as typeof import("@opentelemetry/api");
    /* eslint-enable @typescript-eslint/no-require-imports */
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return {
      traceId: isValidTraceId(ctx.traceId) ? ctx.traceId : undefined,
      spanId: isValidSpanId(ctx.spanId) ? ctx.spanId : undefined,
    };
  } catch {
    return {};
  }
}

// ─── Root pino instance ───────────────────────────────────────────────────────

/**
 * pino is configured without a worker-thread transport because Next.js kills
 * worker threads spawned inside the server runtime.
 *
 * Output is always newline-delimited JSON. For human-readable output in
 * development pipe stdout through pino-pretty:
 *
 *   pnpm dev 2>&1 | pnpm pino-pretty
 */
const rootLogger = pino({
  level: LOG_LEVEL,
  base: undefined, // omit pid / hostname; services add their own base
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
});

// ─── Service logger factory ───────────────────────────────────────────────────

export type ServiceLogger = {
  trace(fields: LogFields, msg: string): void;
  debug(fields: LogFields, msg: string): void;
  info(fields: LogFields, msg: string): void;
  warn(fields: LogFields, msg: string): void;
  error(fields: LogFields, msg: string): void;
  fatal(fields: LogFields, msg: string): void;
};

/**
 * Create a logger bound to a named service.
 * Merges (in order): service base → AsyncLocalStorage context → OTel span ids → call-site fields.
 */
export function createServiceLogger(service: string): ServiceLogger {
  const child = rootLogger.child({ service });

  function buildFields(fields: LogFields): LogFields {
    const ctx = getLogContext();
    const span = getActiveSpanIds();
    return {
      ...ctx,
      ...span,
      ...fields,
    };
  }

  return {
    trace: (fields, msg) => child.trace(buildFields(fields), msg),
    debug: (fields, msg) => child.debug(buildFields(fields), msg),
    info: (fields, msg) => child.info(buildFields(fields), msg),
    warn: (fields, msg) => child.warn(buildFields(fields), msg),
    error: (fields, msg) => child.error(buildFields(fields), msg),
    fatal: (fields, msg) => child.fatal(buildFields(fields), msg),
  };
}
