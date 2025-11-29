import { describe, it, expect } from "vitest";

// Import will fail until we implement the schemas
import {
  signupSchema,
  verifyTokenSchema,
  verifyCodeSchema,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation/auth";

describe("signupSchema", () => {
  describe("email validation", () => {
    it("accepts valid email", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing email", () => {
      const result = signupSchema.safeParse({
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod 4 returns "Invalid input: expected string, received undefined" for missing fields
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0]?.path).toContain("email");
      }
    });

    it("rejects invalid email format", () => {
      const result = signupSchema.safeParse({
        email: "invalid-email",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid email format");
      }
    });

    it("rejects email without domain", () => {
      const result = signupSchema.safeParse({
        email: "test@",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email with invalid characters", () => {
      const result = signupSchema.safeParse({
        email: "test user@example.com",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("trims whitespace from email", () => {
      const result = signupSchema.safeParse({
        email: "  test@example.com  ",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("lowercases email", () => {
      const result = signupSchema.safeParse({
        email: "TEST@Example.COM",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("trims and lowercases email together", () => {
      const result = signupSchema.safeParse({
        email: "  TEST@Example.COM  ",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });
  });

  describe("password validation", () => {
    const validEmail = "test@example.com";

    it("accepts valid password with all requirements", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("accepts password with exactly 12 characters", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "Abcdefgh12!@",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing password", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod 4 returns "Invalid input: expected string, received undefined" for missing fields
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0]?.path).toContain("password");
      }
    });

    it("rejects password shorter than 12 characters", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "Short1!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
        );
      }
    });

    it("rejects password with 11 characters (boundary)", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "Abcdefgh1!@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without uppercase letter", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "securepass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) =>
            e.message.includes("uppercase letter")
          )
        ).toBe(true);
      }
    });

    it("rejects password without lowercase letter", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "SECUREPASS123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) =>
            e.message.includes("lowercase letter")
          )
        ).toBe(true);
      }
    });

    it("rejects password without number", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "SecurePassword!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) => e.message.includes("number"))
        ).toBe(true);
      }
    });

    it("rejects password without special character", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "SecurePass1234",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) =>
            e.message.includes("special character")
          )
        ).toBe(true);
      }
    });

    it("accepts various special characters", () => {
      const specialChars = [
        "!",
        "@",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "(",
        ")",
        "_",
        "+",
        "-",
        "=",
        "[",
        "]",
        "{",
        "}",
        ";",
        "'",
        ":",
        '"',
        "\\",
        "|",
        ",",
        ".",
        "<",
        ">",
        "/",
        "?",
      ];

      for (const char of specialChars) {
        const result = signupSchema.safeParse({
          email: validEmail,
          password: `SecurePass12${char}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("reports all validation errors at once", () => {
      const result = signupSchema.safeParse({
        email: validEmail,
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple issues (too short, no uppercase, no number, no special char)
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });

  describe("combined validation", () => {
    it("rejects empty object", () => {
      const result = signupSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects null input", () => {
      const result = signupSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects undefined input", () => {
      const result = signupSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("rejects array input", () => {
      const result = signupSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("strips extra fields", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePass123!",
        extraField: "should be ignored",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("extraField");
      }
    });
  });
});

describe("verifyTokenSchema", () => {
  it("accepts valid token_hash and type", () => {
    const result = verifyTokenSchema.safeParse({
      token_hash: "abc123",
      type: "email",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing token_hash", () => {
    const result = verifyTokenSchema.safeParse({
      type: "email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty token_hash", () => {
    const result = verifyTokenSchema.safeParse({
      token_hash: "",
      type: "email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((e) => e.message.includes("Token is required"))
      ).toBe(true);
    }
  });

  it("rejects missing type", () => {
    const result = verifyTokenSchema.safeParse({
      token_hash: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type value", () => {
    const result = verifyTokenSchema.safeParse({
      token_hash: "abc123",
      type: "password",
    });
    expect(result.success).toBe(false);
  });

  it("accepts long token_hash values", () => {
    const longToken = "a".repeat(256);
    const result = verifyTokenSchema.safeParse({
      token_hash: longToken,
      type: "email",
    });
    expect(result.success).toBe(true);
  });
});

describe("verifyCodeSchema", () => {
  it("accepts valid code", () => {
    const result = verifyCodeSchema.safeParse({
      code: "authorization_code_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing code", () => {
    const result = verifyCodeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty code", () => {
    const result = verifyCodeSchema.safeParse({
      code: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((e) => e.message.includes("Code is required"))
      ).toBe(true);
    }
  });

  it("accepts long code values", () => {
    const longCode = "b".repeat(512);
    const result = verifyCodeSchema.safeParse({
      code: longCode,
    });
    expect(result.success).toBe(true);
  });
});

describe("PASSWORD_MIN_LENGTH", () => {
  it("exports PASSWORD_MIN_LENGTH constant as 12", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });
});
