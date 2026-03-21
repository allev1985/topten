/**
 * Error handling for the cache service.
 * @module lib/services/cache/errors
 */

import type { CacheServiceErrorCode } from "./types";

/**
 * Cache service error class.
 */
export class CacheServiceError extends Error {
  public readonly code: CacheServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: CacheServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "CacheServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Create a CONNECTION_ERROR for Redis connection failures.
 * @param originalError - The underlying error that caused the connection failure
 * @returns A CacheServiceError with code CONNECTION_ERROR
 */
export function connectionError(originalError?: unknown): CacheServiceError {
  return new CacheServiceError(
    "CONNECTION_ERROR",
    "Failed to connect to cache store",
    originalError
  );
}

/**
 * Create a TIMEOUT error for cache operations that exceeded their deadline.
 * @param originalError - The underlying error that caused the timeout
 * @returns A CacheServiceError with code TIMEOUT
 */
export function timeoutError(originalError?: unknown): CacheServiceError {
  return new CacheServiceError(
    "TIMEOUT",
    "Cache operation timed out",
    originalError
  );
}

/**
 * Create a CONFIGURATION_ERROR for missing or invalid cache config.
 * @param message - Optional custom message (defaults to generic config message)
 * @param originalError - The underlying error, if any
 * @returns A CacheServiceError with code CONFIGURATION_ERROR
 */
export function configurationError(
  message?: string,
  originalError?: unknown
): CacheServiceError {
  return new CacheServiceError(
    "CONFIGURATION_ERROR",
    message ?? "Cache store is not configured",
    originalError
  );
}
