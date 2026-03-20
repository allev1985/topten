import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyMFAForm } from "@/app/(auth)/verify-mfa/_components/VerifyMFAForm";

vi.mock("@/actions/auth-actions", () => ({
  verifyMFAAction: vi.fn(),
  sendMFACodeAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let capturedFormAction: (formData: FormData) => void = vi.fn();

let mockState = {
  data: null as { redirectTo: string } | null,
  error: null as string | null,
  fieldErrors: {} as Record<string, string[]>,
  isSuccess: false,
  isPending: false,
};

vi.mock("@/hooks/use-form-state", () => ({
  useFormState: (_action: unknown) => ({
    state: mockState,
    formAction: capturedFormAction,
    reset: vi.fn(),
  }),
}));

describe("VerifyMFAForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedFormAction = vi.fn();
    mockState = {
      data: null,
      error: null,
      fieldErrors: {},
      isSuccess: false,
      isPending: false,
    };
  });

  describe("rendering", () => {
    it("renders the code input", () => {
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      const input = screen.getByRole("textbox", { name: /verification code/i });
      expect(input).toBeInTheDocument();
    });

    it("code input has correct attributes for OTP entry", () => {
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      const input = screen.getByRole("textbox", { name: /verification code/i });
      expect(input).toHaveAttribute("inputmode", "numeric");
      expect(input).toHaveAttribute("maxlength", "6");
      expect(input).toHaveAttribute("autocomplete", "one-time-code");
    });

    it("renders the Verify submit button", () => {
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      expect(
        screen.getByRole("button", { name: /verify/i })
      ).toBeInTheDocument();
    });

    it("renders the Send again resend button", () => {
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      expect(
        screen.getByRole("button", { name: /send again/i })
      ).toBeInTheDocument();
    });

    it("passes the redirectTo value as a hidden field", () => {
      const { container } = render(<VerifyMFAForm redirectTo="/settings" />);

      const hidden = container.querySelector('input[name="redirectTo"]');
      expect(hidden).toHaveValue("/settings");
    });
  });

  describe("form state display", () => {
    it("shows a top-level error alert when state.error is set", () => {
      mockState.error = "Invalid verification code";

      render(<VerifyMFAForm redirectTo="/dashboard" />);

      expect(screen.getByText("Invalid verification code")).toBeInTheDocument();
    });

    it("shows a code field error when fieldErrors.code is set", () => {
      mockState.fieldErrors = {
        code: ["Enter the 6-digit code from your email"],
      };

      render(<VerifyMFAForm redirectTo="/dashboard" />);

      expect(
        screen.getByText("Enter the 6-digit code from your email")
      ).toBeInTheDocument();
    });

    it("field error has role=alert", () => {
      mockState.fieldErrors = {
        code: ["Enter the 6-digit code from your email"],
      };

      render(<VerifyMFAForm redirectTo="/dashboard" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("disables the Verify button and shows 'Verifying…' when isPending", () => {
      mockState.isPending = true;

      render(<VerifyMFAForm redirectTo="/dashboard" />);

      const button = screen.getByRole("button", { name: /verifying/i });
      expect(button).toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("calls the bound formAction when the form is submitted", () => {
      const { container } = render(<VerifyMFAForm redirectTo="/dashboard" />);

      const form = container.querySelector("form")!;
      fireEvent.submit(form);

      expect(capturedFormAction).toHaveBeenCalled();
    });
  });

  describe("resend code", () => {
    it("calls sendMFACodeAction when Send again is clicked", async () => {
      const { sendMFACodeAction } = await import("@/actions/auth-actions");
      vi.mocked(sendMFACodeAction).mockResolvedValue({});

      const user = userEvent.setup();
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      await user.click(screen.getByRole("button", { name: /send again/i }));

      expect(sendMFACodeAction).toHaveBeenCalledOnce();
    });

    it("shows 'Sending…' while the resend is in flight", async () => {
      const { sendMFACodeAction } = await import("@/actions/auth-actions");
      // Never resolves — keeps button in loading state
      vi.mocked(sendMFACodeAction).mockReturnValue(new Promise(() => {}));

      const user = userEvent.setup();
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      await user.click(screen.getByRole("button", { name: /send again/i }));

      expect(
        screen.getByRole("button", { name: /sending/i })
      ).toBeInTheDocument();
    });

    it("shows an error alert when resend fails", async () => {
      const { sendMFACodeAction } = await import("@/actions/auth-actions");
      vi.mocked(sendMFACodeAction).mockResolvedValue({
        error: "Failed to send verification code. Please try again.",
      });

      const user = userEvent.setup();
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      await user.click(screen.getByRole("button", { name: /send again/i }));

      expect(
        screen.getByText("Failed to send verification code. Please try again.")
      ).toBeInTheDocument();
    });

    it("clears a previous resend error when Send again is clicked again", async () => {
      const { sendMFACodeAction } = await import("@/actions/auth-actions");
      vi.mocked(sendMFACodeAction)
        .mockResolvedValueOnce({
          error: "Failed to send verification code. Please try again.",
        })
        .mockResolvedValueOnce({});

      const user = userEvent.setup();
      render(<VerifyMFAForm redirectTo="/dashboard" />);

      const resendBtn = screen.getByRole("button", { name: /send again/i });

      // First click — triggers error
      await user.click(resendBtn);
      expect(
        screen.getByText("Failed to send verification code. Please try again.")
      ).toBeInTheDocument();

      // Second click — clears the error
      await user.click(screen.getByRole("button", { name: /send again/i }));
      expect(
        screen.queryByText(
          "Failed to send verification code. Please try again."
        )
      ).not.toBeInTheDocument();
    });
  });
});
