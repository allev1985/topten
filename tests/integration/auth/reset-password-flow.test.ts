import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the Supabase server client
const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        getUser: mockGetUser,
      },
    })
  ),
}));

// Import the page component after mocking
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

describe("ResetPasswordPage - Code Exchange Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "123" }, session: { access_token: "token" } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  describe("User Story 1: Password Reset via Email Link", () => {
    it("exchanges valid code for session and renders form", async () => {
      const searchParams = Promise.resolve({ code: "valid_code" });

      const page = await ResetPasswordPage({ searchParams });
      const { container } = render(page);

      // Should call exchangeCodeForSession
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid_code");

      // Should render the form (look for form elements)
      expect(container.querySelector("form")).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it("renders expired error when code is expired", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });

      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      // Should show expired error
      expect(screen.getByText("Reset Link Expired")).toBeInTheDocument();
      expect(
        screen.getByText(/password reset links are only valid/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /request a new password reset link/i })
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("renders invalid error when code exchange fails", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid authorization code" },
      });

      const searchParams = Promise.resolve({ code: "invalid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      // Should show invalid error
      expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
      expect(
        screen.getByText(/password reset link you followed is invalid/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /request a new password reset link/i })
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("logs code exchange attempts", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const searchParams = Promise.resolve({ code: "valid_code" });

      await ResetPasswordPage({ searchParams });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Attempting code exchange"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Code exchange successful"
      );

      consoleSpy.mockRestore();
    });

    it("logs expired code errors", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });

      const searchParams = Promise.resolve({ code: "expired_code" });

      await ResetPasswordPage({ searchParams });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Attempting code exchange"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Code exchange failed: expired"
      );

      consoleSpy.mockRestore();
    });

    it("logs invalid code errors", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid authorization code" },
      });

      const searchParams = Promise.resolve({ code: "invalid_code" });

      await ResetPasswordPage({ searchParams });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Attempting code exchange"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "Code exchange failed: invalid"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("User Story 2: Authenticated User Password Change", () => {
    it("renders form when user has existing session (no code)", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      const { container } = render(page);

      // Should check for existing session
      expect(mockGetUser).toHaveBeenCalled();

      // Should NOT call exchangeCodeForSession
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();

      // Should render the form
      expect(container.querySelector("form")).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it("logs authenticated user access", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const searchParams = Promise.resolve({});

      await ResetPasswordPage({ searchParams });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "User has existing session"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("User Story 3: Unauthorized Access Prevention", () => {
    it("renders access denied when no code and no session", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      // Should show access denied error
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(
        screen.getByText(/to reset your password, please request/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /request a new password reset link/i })
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("logs access denied scenarios", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const searchParams = Promise.resolve({});

      await ResetPasswordPage({ searchParams });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ResetPassword]",
        "No code and no session - access denied"
      );

      consoleSpy.mockRestore();
    });
  });
});
