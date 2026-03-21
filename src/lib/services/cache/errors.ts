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

/** Factory: Redis connection failed. */
export function connectionError(originalError?: unknown): CacheServiceError {
  return new CacheServiceError(
    "CONNECTION_ERROR",
    "Failed to connect to cache store",
    originalError
  );
}

/** Factory: Operation timed out. */
export function timeoutError(originalError?: unknown): CacheServiceError {
  return new CacheServiceError(
    "TIMEOUT",
    "Cache operation timed out",
    originalError
  );
}

/** Factory: Missing or invalid configuration. */
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
