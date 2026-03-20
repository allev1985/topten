import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMFACodeAction, verifyMFAAction } from "@/actions/auth-actions";

// Mock Next.js navigation — simulate Next.js redirect digest format
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`REDIRECT:${url}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock auth service (auto-mock)
vi.mock("@/lib/auth/service");

vi.mock("@/lib/auth/errors", () => ({
  AuthServiceError: class AuthServiceError extends Error {
    public readonly code: string;
    public readonly originalError?: unknown;

    constructor(code: string, message: string, originalError?: unknown) {
      super(message);
      this.name = "AuthServiceError";
      this.code = code;
      this.originalError = originalError;
    }
  },
  isEmailNotVerifiedError: vi.fn(),
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import after mocking
import { sendMFACode, verifyMFACode } from "@/lib/auth";
import { AuthServiceError } from "@/lib/auth/errors";

const mockSendMFACode = vi.mocked(sendMFACode);
const mockVerifyMFACode = vi.mocked(verifyMFACode);

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
} satisfies import("@/types/forms").ActionState<unknown>;

describe("MFA actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendMFACodeAction()", () => {
    it("returns an empty object on success", async () => {
      mockSendMFACode.mockResolvedValue(undefined);

      const result = await sendMFACodeAction();

      expect(result).toEqual({});
      expect(mockSendMFACode).toHaveBeenCalledOnce();
    });

    it("returns an error message when sendMFACode throws", async () => {
      mockSendMFACode.mockRejectedValue(
        new AuthServiceError("INVALID_MFA_SESSION", "No active login session.")
      );

      const result = await sendMFACodeAction();

      expect(result).toEqual({
        error: "Failed to send verification code. Please try again.",
      });
    });

    it("returns an error message for unexpected errors too", async () => {
      mockSendMFACode.mockRejectedValue(new Error("Network failure"));

      const result = await sendMFACodeAction();

      expect(result.error).toBeTruthy();
    });
  });

  describe("verifyMFAAction()", () => {
    describe("code validation", () => {
      it("returns fieldErrors when code is missing", async () => {
        const formData = createFormData({});

        const result = await verifyMFAAction(initialState, formData);

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.code).toContain(
          "Enter the 6-digit code from your email"
        );
        expect(mockVerifyMFACode).not.toHaveBeenCalled();
      });

      it("returns fieldErrors when code is empty string", async () => {
        const formData = createFormData({ code: "" });

        const result = await verifyMFAAction(initialState, formData);

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.code).toBeDefined();
      });

      it("returns fieldErrors when code has fewer than 6 digits", async () => {
        const formData = createFormData({ code: "12345" });

        const result = await verifyMFAAction(initialState, formData);

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.code).toBeDefined();
        expect(mockVerifyMFACode).not.toHaveBeenCalled();
      });

      it("returns fieldErrors when code has more than 6 digits", async () => {
        const formData = createFormData({ code: "1234567" });

        const result = await verifyMFAAction(initialState, formData);

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.code).toBeDefined();
      });

      it("returns fieldErrors when code contains non-numeric characters", async () => {
        const formData = createFormData({ code: "12345a" });

        const result = await verifyMFAAction(initialState, formData);

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.code).toBeDefined();
      });
    });

    describe("service error handling", () => {
      it("returns the error message for INVALID_MFA_CODE", async () => {
        mockVerifyMFACode.mockRejectedValue(
          new AuthServiceError("INVALID_MFA_CODE", "Invalid verification code")
        );

        const result = await verifyMFAAction(
          initialState,
          createFormData({ code: "000000" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Invalid verification code");
        expect(result.fieldErrors).toEqual({});
      });

      it("appends 'Please log in again.' for INVALID_MFA_SESSION", async () => {
        mockVerifyMFACode.mockRejectedValue(
          new AuthServiceError(
            "INVALID_MFA_SESSION",
            "Your session has expired."
          )
        );

        const result = await verifyMFAAction(
          initialState,
          createFormData({ code: "123456" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain("Please log in again.");
      });

      it("appends 'Please log in again.' for MFA_CODE_EXPIRED", async () => {
        mockVerifyMFACode.mockRejectedValue(
          new AuthServiceError(
            "MFA_CODE_EXPIRED",
            "Verification code has expired."
          )
        );

        const result = await verifyMFAAction(
          initialState,
          createFormData({ code: "123456" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain("Please log in again.");
      });

      it("appends 'Please log in again.' for TOO_MANY_MFA_ATTEMPTS", async () => {
        mockVerifyMFACode.mockRejectedValue(
          new AuthServiceError(
            "TOO_MANY_MFA_ATTEMPTS",
            "Too many incorrect attempts."
          )
        );

        const result = await verifyMFAAction(
          initialState,
          createFormData({ code: "123456" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain("Please log in again.");
      });

      it("returns a generic error for unexpected exceptions", async () => {
        mockVerifyMFACode.mockRejectedValue(new Error("Database failure"));

        const result = await verifyMFAAction(
          initialState,
          createFormData({ code: "123456" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Something went wrong. Please try again.");
      });
    });

    describe("successful verification", () => {
      it("redirects to /dashboard when no redirectTo is provided", async () => {
        mockVerifyMFACode.mockResolvedValue({
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            emailVerified: true,
          },
        });

        await expect(
          verifyMFAAction(initialState, createFormData({ code: "123456" }))
        ).rejects.toThrow("REDIRECT:/dashboard");
      });

      it("redirects to a valid redirectTo when provided", async () => {
        mockVerifyMFACode.mockResolvedValue({
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            emailVerified: true,
          },
        });

        await expect(
          verifyMFAAction(
            initialState,
            createFormData({ code: "123456", redirectTo: "/settings" })
          )
        ).rejects.toThrow("REDIRECT:/settings");
      });

      it("ignores invalid redirectTo and falls back to /dashboard", async () => {
        mockVerifyMFACode.mockResolvedValue({
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            emailVerified: true,
          },
        });

        await expect(
          verifyMFAAction(
            initialState,
            createFormData({
              code: "123456",
              redirectTo: "https://evil.com/steal",
            })
          )
        ).rejects.toThrow("REDIRECT:/dashboard");
      });
    });
  });
});
