import { describe, it, expect } from "vitest";
import {
  TagServiceError,
  notFoundError,
  validationError,
  tagServiceError,
} from "@/lib/tag/errors";

describe("TagServiceError", () => {
  it("carries code, message and originalError", () => {
    const cause = new Error("underlying");
    const err = new TagServiceError("SERVICE_ERROR", "boom", cause);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("TagServiceError");
    expect(err.code).toBe("SERVICE_ERROR");
    expect(err.message).toBe("boom");
    expect(err.originalError).toBe(cause);
  });
});

describe("notFoundError", () => {
  it("produces a NOT_FOUND error", () => {
    const err = notFoundError();
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("not found");
  });
});

describe("validationError", () => {
  it("produces a VALIDATION_ERROR with the given message", () => {
    const err = validationError("Too many tags");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Too many tags");
  });
});

describe("tagServiceError", () => {
  it("defaults the message when none provided", () => {
    const err = tagServiceError();
    expect(err.code).toBe("SERVICE_ERROR");
    expect(err.message).toBe("An unexpected error occurred");
  });

  it("uses the provided message and wraps the cause", () => {
    const cause = new Error("db");
    const err = tagServiceError("Failed", cause);
    expect(err.message).toBe("Failed");
    expect(err.originalError).toBe(cause);
  });
});
