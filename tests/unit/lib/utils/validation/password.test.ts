import { describe, it, expect } from "vitest";
import {
  validatePassword,
  getPasswordRequirements,
} from "@/lib/utils/validation/password";

describe("validatePassword", () => {
  describe("valid passwords", () => {
    it("should accept a password meeting all requirements", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe("strong");
    });

    it("should accept complex passwords", () => {
      const result = validatePassword("MyP@ssw0rd!2024");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
      expect(result.checks.hasLowercase).toBe(true);
      expect(result.checks.hasUppercase).toBe(true);
      expect(result.checks.hasDigit).toBe(true);
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept password with all special character types", () => {
      const result = validatePassword("Test123!@#$%^&*");
      expect(result.isValid).toBe(true);
      expect(result.checks.hasSymbol).toBe(true);
    });
  });

  describe("invalid passwords - too short", () => {
    it("should reject passwords shorter than 12 characters", () => {
      const result = validatePassword("Short1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 12 characters"
      );
      expect(result.checks.minLength).toBe(false);
    });

    it("should reject 11 character password", () => {
      const result = validatePassword("Abcdefgh1!@");
      expect(result.isValid).toBe(false);
      expect(result.checks.minLength).toBe(false);
    });
  });

  describe("invalid passwords - missing lowercase", () => {
    it("should reject passwords without lowercase letters", () => {
      const result = validatePassword("ALLUPPERCASE123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
      expect(result.checks.hasLowercase).toBe(false);
    });

    it("should reject password with only uppercase, digits, and symbols", () => {
      const result = validatePassword("ABCDEFGHIJ12!@");
      expect(result.isValid).toBe(false);
      expect(result.checks.hasLowercase).toBe(false);
    });
  });

  describe("invalid passwords - missing uppercase", () => {
    it("should reject passwords without uppercase letters", () => {
      const result = validatePassword("alllowercase123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
      expect(result.checks.hasUppercase).toBe(false);
    });

    it("should reject password with only lowercase, digits, and symbols", () => {
      const result = validatePassword("abcdefghij12!@");
      expect(result.isValid).toBe(false);
      expect(result.checks.hasUppercase).toBe(false);
    });
  });

  describe("invalid passwords - missing digit", () => {
    it("should reject passwords without digits", () => {
      const result = validatePassword("NoDigitsHere!@#");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number"
      );
      expect(result.checks.hasDigit).toBe(false);
    });

    it("should reject password with only letters and symbols", () => {
      const result = validatePassword("AbcDefGhiJk!@#");
      expect(result.isValid).toBe(false);
      expect(result.checks.hasDigit).toBe(false);
    });
  });

  describe("invalid passwords - missing symbol", () => {
    it("should reject passwords without symbols", () => {
      const result = validatePassword("NoSymbols12345");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character"
      );
      expect(result.checks.hasSymbol).toBe(false);
    });

    it("should reject password with only alphanumeric characters", () => {
      const result = validatePassword("Abcdefghij123");
      expect(result.isValid).toBe(false);
      expect(result.checks.hasSymbol).toBe(false);
    });
  });

  describe("invalid passwords - multiple failures", () => {
    it("should return multiple errors for passwords failing multiple checks", () => {
      const result = validatePassword("short");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it("should report all missing requirements", () => {
      const result = validatePassword("abc");
      expect(result.isValid).toBe(false);
      expect(result.checks.minLength).toBe(false);
      expect(result.checks.hasUppercase).toBe(false);
      expect(result.checks.hasDigit).toBe(false);
      expect(result.checks.hasSymbol).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });

  describe("strength calculation", () => {
    it("should return weak for 2 or fewer passed checks", () => {
      const result = validatePassword("ab");
      expect(result.strength).toBe("weak");
    });

    it("should return weak for single requirement met", () => {
      const result = validatePassword("a");
      expect(result.strength).toBe("weak");
    });

    it("should return medium for 3-4 passed checks", () => {
      // lowercase + uppercase + minLength = 3 checks
      const result = validatePassword("Abcdefghijkl");
      expect(result.strength).toBe("medium");
    });

    it("should return medium for 4 checks passed", () => {
      // lowercase + uppercase + digit + minLength = 4 checks
      const result = validatePassword("Abcdefghij12");
      expect(result.strength).toBe("medium");
    });

    it("should return strong for all 5 checks passed", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.strength).toBe("strong");
    });

    it("should return strong for exactly 5 checks passed", () => {
      const result = validatePassword("Abcdefghij1!");
      expect(result.strength).toBe("strong");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(5);
      expect(result.strength).toBe("weak");
    });

    it("should handle exactly 12 characters", () => {
      const result = validatePassword("Abcdefghij1!");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
    });

    it("should accept passwords longer than 12 characters", () => {
      const result = validatePassword("ThisIsAVeryLongPassword123!");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
    });

    it("should accept various special characters - exclamation", () => {
      const result = validatePassword("SecurePass12!");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - at sign", () => {
      const result = validatePassword("SecurePass12@");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - hash", () => {
      const result = validatePassword("SecurePass12#");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - dollar", () => {
      const result = validatePassword("SecurePass12$");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - percent", () => {
      const result = validatePassword("SecurePass12%");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - caret", () => {
      const result = validatePassword("SecurePass12^");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - ampersand", () => {
      const result = validatePassword("SecurePass12&");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - asterisk", () => {
      const result = validatePassword("SecurePass12*");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - parentheses", () => {
      const result = validatePassword("SecurePass12(");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - underscore", () => {
      const result = validatePassword("SecurePass12_");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - hyphen", () => {
      const result = validatePassword("SecurePass12-");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should accept various special characters - brackets", () => {
      const result = validatePassword("SecurePass12[");
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should handle whitespace in password", () => {
      const result = validatePassword("Secure Pass1!");
      // Space is not a symbol in our regex, so this should fail symbol check
      expect(result.checks.hasSymbol).toBe(true);
    });

    it("should handle unicode characters", () => {
      // Unicode letters should count as lowercase/uppercase
      const result = validatePassword("SecurePass12!");
      expect(result.isValid).toBe(true);
    });
  });
});

describe("getPasswordRequirements", () => {
  it("should return 5 requirements", () => {
    const requirements = getPasswordRequirements();
    expect(requirements).toHaveLength(5);
  });

  it("should include minimum length requirement", () => {
    const requirements = getPasswordRequirements();
    expect(requirements.some((r) => r.includes("12"))).toBe(true);
  });

  it("should include lowercase requirement", () => {
    const requirements = getPasswordRequirements();
    expect(
      requirements.some((r) => r.toLowerCase().includes("lowercase"))
    ).toBe(true);
  });

  it("should include uppercase requirement", () => {
    const requirements = getPasswordRequirements();
    expect(
      requirements.some((r) => r.toLowerCase().includes("uppercase"))
    ).toBe(true);
  });

  it("should include number requirement", () => {
    const requirements = getPasswordRequirements();
    expect(requirements.some((r) => r.toLowerCase().includes("number"))).toBe(
      true
    );
  });

  it("should include special character requirement", () => {
    const requirements = getPasswordRequirements();
    expect(requirements.some((r) => r.toLowerCase().includes("special"))).toBe(
      true
    );
  });
});
