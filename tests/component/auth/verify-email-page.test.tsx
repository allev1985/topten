import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VerificationPending } from "@/app/(auth)/verify-email/verification-pending";
import { VerificationSuccess } from "@/app/(auth)/verify-email/verification-success";
import { VerificationError } from "@/app/(auth)/verify-email/verification-error";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock the resendVerificationAction
vi.mock("@/actions/auth-actions", () => ({
  resendVerificationAction: vi.fn(),
}));

describe("VerifyEmailPage Components", () => {
  describe("VerificationPending", () => {
    describe("rendering of instructions", () => {
      it("renders the page title", () => {
        render(<VerificationPending />);

        expect(screen.getByText("Check your email")).toBeInTheDocument();
      });

      it("renders verification instructions", () => {
        render(<VerificationPending />);

        expect(
          screen.getByText(/click the verification link/i)
        ).toBeInTheDocument();
      });
    });

    describe("check spam folder messaging", () => {
      it("includes spam folder reminder", () => {
        render(<VerificationPending />);

        expect(screen.getByText(/check your spam/i)).toBeInTheDocument();
      });

      it("includes junk folder mention", () => {
        render(<VerificationPending />);

        expect(screen.getByText(/spam or junk folder/i)).toBeInTheDocument();
      });

      it("lists troubleshooting steps", () => {
        render(<VerificationPending />);

        // Check that list items exist
        expect(screen.getByRole("list")).toBeInTheDocument();
        const listItems = screen.getAllByRole("listitem");
        expect(listItems.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("accessible content structure", () => {
      it("has the page title", () => {
        render(<VerificationPending />);

        expect(screen.getByText("Check your email")).toBeInTheDocument();
      });

      it("uses semantic HTML main element", () => {
        const { container } = render(<VerificationPending />);

        expect(container.querySelector("main")).toBeInTheDocument();
      });

      it("uses shadcn Card component structure", () => {
        const { container } = render(<VerificationPending />);

        // Card uses div with specific classes
        expect(
          container.querySelector(".rounded-xl.border")
        ).toBeInTheDocument();
      });

      it("has link back to login", () => {
        render(<VerificationPending />);

        const loginLink = screen.getByRole("link", { name: /sign in/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute("href", "/login");
      });
    });

    describe("description text", () => {
      it("shows description about verification link", () => {
        render(<VerificationPending />);

        expect(
          screen.getByText(/sent you a verification link/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("VerificationSuccess", () => {
    it("renders success title", () => {
      render(
        <VerificationSuccess
          message="Email verified successfully"
          redirectTo="/dashboard"
        />
      );

      expect(screen.getByText("Email Verified!")).toBeInTheDocument();
    });

    it("renders success message", () => {
      render(
        <VerificationSuccess
          message="Email verified successfully"
          redirectTo="/dashboard"
        />
      );

      expect(
        screen.getByText("Email verified successfully")
      ).toBeInTheDocument();
    });

    it("shows redirect message", () => {
      render(
        <VerificationSuccess
          message="Email verified successfully"
          redirectTo="/dashboard"
        />
      );

      expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument();
    });

    it("uses semantic HTML main element", () => {
      const { container } = render(
        <VerificationSuccess
          message="Email verified successfully"
          redirectTo="/dashboard"
        />
      );

      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("has accessible status message", () => {
      render(
        <VerificationSuccess
          message="Email verified successfully"
          redirectTo="/dashboard"
        />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("VerificationError", () => {
    it("renders error title", () => {
      render(<VerificationError error="Link has expired" />);

      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    });

    it("renders the error message", () => {
      render(<VerificationError error="This verification link has expired" />);

      expect(
        screen.getByText("This verification link has expired")
      ).toBeInTheDocument();
    });

    it("displays resend email form", () => {
      render(<VerificationError error="Link has expired" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /resend verification email/i })
      ).toBeInTheDocument();
    });

    it("has email input with correct attributes", () => {
      render(<VerificationError error="Link has expired" />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toBeRequired();
    });

    it("uses semantic HTML main element", () => {
      const { container } = render(
        <VerificationError error="Link has expired" />
      );

      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("has link back to login", () => {
      render(<VerificationError error="Link has expired" />);

      const loginLink = screen.getByRole("link", { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("allows user to type in email field", () => {
      render(<VerificationError error="Link has expired" />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput).toHaveValue("test@example.com");
    });
  });
});
