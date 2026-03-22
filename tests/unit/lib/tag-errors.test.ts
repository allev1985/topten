import { describe, it, expect } from "vitest";
import {
  TagServiceError,
  notFoundError,
  duplicateTagError,
  validationError,
  tagServiceError,
} from "@/lib/tag/errors";

describe("Tag Errors", () => {
  describe("TagServiceError", () => {
    it("is an instance of Error", () => {
      const err = new TagServiceError("SERVICE_ERROR", "test");
      expect(err).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
      const err = new TagServiceError("NOT_FOUND", "test");
      expect(err.name).toBe("TagServiceError");
    });

    it("stores code and message", () => {
      const err = new TagServiceError("NOT_FOUND", "Tag not found");
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("Tag not found");
    });

    it("stores original error when provided", () => {
      const original = new Error("raw");
      const err = new TagServiceError("SERVICE_ERROR", "wrap", original);
      expect(err.originalError).toBe(original);
    });

    it("original error is undefined when not provided", () => {
      const err = new TagServiceError("SERVICE_ERROR", "no wrap");
      expect(err.originalError).toBeUndefined();
    });
  });

  describe("notFoundError", () => {
    it("creates NOT_FOUND error", () => {
      const err = notFoundError();
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("Tag not found.");
    });

    it("wraps original error", () => {
      const original = new Error("raw");
      const err = notFoundError(original);
      expect(err.originalError).toBe(original);
    });
  });

  describe("duplicateTagError", () => {
    it("creates DUPLICATE_TAG error", () => {
      const err = duplicateTagError();
      expect(err.code).toBe("DUPLICATE_TAG");
      expect(err.message).toContain("already exists");
    });
  });

  describe("validationError", () => {
    it("creates VALIDATION_ERROR with custom message", () => {
      const err = validationError("Name too short");
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("Name too short");
    });
  });

  describe("tagServiceError", () => {
    it("creates SERVICE_ERROR with default message", () => {
      const err = tagServiceError();
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.message).toBe("An unexpected error occurred");
    });

    it("creates SERVICE_ERROR with custom message", () => {
      const err = tagServiceError("Custom message");
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.message).toBe("Custom message");
    });

    it("wraps original error", () => {
      const original = new Error("raw");
      const err = tagServiceError("wrap", original);
      expect(err.originalError).toBe(original);
    });
  });
});
