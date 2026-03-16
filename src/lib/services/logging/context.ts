/**
 * Request-scoped log context
 *
 * Uses AsyncLocalStorage to propagate userId and sessionId through the
 * call stack without explicit passing. Set once per server action or API
 * route; every logger instance reads from it automatically.
 */

import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

const storage = new AsyncLocalStorage<LogContext>();

/**
 * Run a function with a bound log context. All logger calls within fn()
 * will automatically include the provided context fields.
 */
export function withLogContext<T>(context: LogContext, fn: () => T): T {
  return storage.run(context, fn);
}

/**
 * Return the current log context, or an empty object if none is set.
 */
export function getLogContext(): LogContext {
  return storage.getStore() ?? {};
}
