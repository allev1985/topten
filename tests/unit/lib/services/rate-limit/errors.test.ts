import { describe, it, expect } from "vitest";
import { RateLimitError } from "@/lib/services/rate-limit/errors";

describe("RateLimitError", () => {
  it("sets name, message, and retryAfterSeconds", () => {
    const err = new RateLimitError("Too many requests", 45);

    expect(err.name).toBe("RateLimitError");
    expect(err.message).toBe("Too many requests");
    expect(err.retryAfterSeconds).toBe(45);
    expect(err).toBeInstanceOf(Error);
  });

  it("retryAfterSeconds can be zero", () => {
    const err = new RateLimitError("limit hit", 0);

    expect(err.retryAfterSeconds).toBe(0);
  });
});
