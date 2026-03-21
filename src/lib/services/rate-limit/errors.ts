/**
 * Error handling for the rate limit service.
 * @module lib/services/rate-limit/errors
 */

export class RateLimitError extends Error {
  public readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
