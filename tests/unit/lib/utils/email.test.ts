import { describe, it, expect } from "vitest";
import { maskEmail } from "@/lib/utils/email";

describe("maskEmail", () => {
  it("masks email with standard format", () => {
    expect(maskEmail("test@example.com")).toBe("te***@example.com");
  });

  it("masks email with longer local part", () => {
    expect(maskEmail("alexander@example.com")).toBe("al***@example.com");
  });

  it("handles email with short local part (2 chars)", () => {
    expect(maskEmail("te@example.com")).toBe("te***@example.com");
  });

  it("handles email with very short local part (1 char)", () => {
    expect(maskEmail("t@example.com")).toBe("t***@example.com");
  });

  it("handles email without domain", () => {
    expect(maskEmail("test")).toBe("te***@unknown");
  });

  it("handles email with empty local part", () => {
    expect(maskEmail("@example.com")).toBe("***@example.com");
  });

  it("handles empty string", () => {
    expect(maskEmail("")).toBe("***@unknown");
  });

  it("handles subdomain emails", () => {
    expect(maskEmail("test@mail.example.com")).toBe("te***@mail.example.com");
  });
});
