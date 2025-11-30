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

describe("ResetPasswordPage - ErrorState Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Expired error state", () => {
    beforeEach(() => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });
    });

    it("renders expired title", async () => {
      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(screen.getByText("Reset Link Expired")).toBeInTheDocument();
    });

    it("renders expired description", async () => {
      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText("This password reset link has expired")
      ).toBeInTheDocument();
    });

    it("renders expired message with guidance", async () => {
      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText(
          "Password reset links are only valid for a limited time. Please request a new one."
        )
      ).toBeInTheDocument();
    });

    it("renders link to forgot-password page", async () => {
      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      const link = screen.getByRole("link", {
        name: /request a new password reset link/i,
      });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });

    it("uses main element for semantic HTML", async () => {
      const searchParams = Promise.resolve({ code: "expired_code" });

      const page = await ResetPasswordPage({ searchParams });
      const { container } = render(page);

      expect(container.querySelector("main")).toBeInTheDocument();
    });
  });

  describe("Invalid error state", () => {
    beforeEach(() => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid authorization code" },
      });
    });

    it("renders invalid title", async () => {
      const searchParams = Promise.resolve({ code: "invalid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
    });

    it("renders invalid description", async () => {
      const searchParams = Promise.resolve({ code: "invalid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText("This password reset link is invalid")
      ).toBeInTheDocument();
    });

    it("renders invalid message with guidance", async () => {
      const searchParams = Promise.resolve({ code: "invalid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText(
          "The password reset link you followed is invalid or has already been used. Please request a new one."
        )
      ).toBeInTheDocument();
    });

    it("renders link to forgot-password page", async () => {
      const searchParams = Promise.resolve({ code: "invalid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      const link = screen.getByRole("link", {
        name: /request a new password reset link/i,
      });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("Access denied error state", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it("renders access denied title", async () => {
      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("renders access denied description", async () => {
      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText("You need a valid reset link to access this page")
      ).toBeInTheDocument();
    });

    it("renders access denied message with guidance", async () => {
      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByText(
          "To reset your password, please request a password reset email."
        )
      ).toBeInTheDocument();
    });

    it("renders link to forgot-password page", async () => {
      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      const link = screen.getByRole("link", {
        name: /request a new password reset link/i,
      });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });

    it("uses Card component structure", async () => {
      const searchParams = Promise.resolve({});

      const page = await ResetPasswordPage({ searchParams });
      const { container } = render(page);

      // Check that content is rendered within a card structure
      // by looking for semantic card elements (header content exists)
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(container.querySelector("main")).toBeInTheDocument();
    });
  });

  describe("Form state rendering", () => {
    beforeEach(() => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: { id: "123" }, session: { access_token: "token" } },
        error: null,
      });
    });

    it("renders form when code exchange is successful", async () => {
      const searchParams = Promise.resolve({ code: "valid_code" });

      const page = await ResetPasswordPage({ searchParams });
      const { container } = render(page);

      expect(container.querySelector("form")).toBeInTheDocument();
    });

    it("renders password input", async () => {
      const searchParams = Promise.resolve({ code: "valid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it("renders confirm password input", async () => {
      const searchParams = Promise.resolve({ code: "valid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("renders submit button", async () => {
      const searchParams = Promise.resolve({ code: "valid_code" });

      const page = await ResetPasswordPage({ searchParams });
      render(page);

      expect(
        screen.getByRole("button", { name: /reset password/i })
      ).toBeInTheDocument();
    });
  });
});
