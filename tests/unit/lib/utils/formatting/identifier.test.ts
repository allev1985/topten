import { describe, it, expect } from "vitest";
import { hashIdentifier } from "@/lib/utils/formatting/identifier";

describe("hashIdentifier", () => {
  it("returns a string prefixed with sha256:", () => {
    expect(hashIdentifier("user@example.com")).toMatch(/^sha256:[0-9a-f]{12}$/);
  });

  it("produces a consistent hash for the same input", () => {
    expect(hashIdentifier("user@example.com")).toBe(
      hashIdentifier("user@example.com")
    );
  });

  it("produces different hashes for different inputs", () => {
    expect(hashIdentifier("user@example.com")).not.toBe(
      hashIdentifier("other@example.com")
    );
  });

  it("works with IP addresses", () => {
    expect(hashIdentifier("192.168.1.1")).toMatch(/^sha256:[0-9a-f]{12}$/);
  });

  it("works with user IDs", () => {
    expect(hashIdentifier("abc123-uuid-here")).toMatch(
      /^sha256:[0-9a-f]{12}$/
    );
  });

  it("handles empty string", () => {
    expect(hashIdentifier("")).toMatch(/^sha256:[0-9a-f]{12}$/);
  });
});
