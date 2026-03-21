import { describe, it, expect } from "vitest";
import {
  CacheServiceError,
  connectionError,
  timeoutError,
  configurationError,
} from "@/lib/services/cache/errors";

describe("CacheServiceError", () => {
  it("sets name, code, message, and originalError", () => {
    const original = new Error("boom");
    const err = new CacheServiceError("TIMEOUT", "timed out", original);

    expect(err.name).toBe("CacheServiceError");
    expect(err.code).toBe("TIMEOUT");
    expect(err.message).toBe("timed out");
    expect(err.originalError).toBe(original);
    expect(err).toBeInstanceOf(Error);
  });

  it("allows originalError to be undefined", () => {
    const err = new CacheServiceError("CONNECTION_ERROR", "failed");

    expect(err.originalError).toBeUndefined();
  });
});

describe("connectionError", () => {
  it("creates a CONNECTION_ERROR with the original error", () => {
    const original = new Error("ECONNREFUSED");
    const err = connectionError(original);

    expect(err.code).toBe("CONNECTION_ERROR");
    expect(err.message).toBe("Failed to connect to cache store");
    expect(err.originalError).toBe(original);
  });

  it("works without an original error", () => {
    const err = connectionError();

    expect(err.code).toBe("CONNECTION_ERROR");
    expect(err.originalError).toBeUndefined();
  });
});

describe("timeoutError", () => {
  it("creates a TIMEOUT error with the original error", () => {
    const original = new Error("deadline exceeded");
    const err = timeoutError(original);

    expect(err.code).toBe("TIMEOUT");
    expect(err.message).toBe("Cache operation timed out");
    expect(err.originalError).toBe(original);
  });
});

describe("configurationError", () => {
  it("creates a CONFIGURATION_ERROR with a custom message", () => {
    const err = configurationError("REDIS_URL is missing");

    expect(err.code).toBe("CONFIGURATION_ERROR");
    expect(err.message).toBe("REDIS_URL is missing");
  });

  it("uses a default message when none is provided", () => {
    const err = configurationError();

    expect(err.message).toBe("Cache store is not configured");
  });

  it("attaches the original error", () => {
    const original = new Error("parse failed");
    const err = configurationError("bad url", original);

    expect(err.originalError).toBe(original);
  });
});
