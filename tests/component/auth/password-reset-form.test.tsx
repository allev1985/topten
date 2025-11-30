import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

// Mock useFormState
const mockFormAction = vi.fn();
const mockUseFormState = vi.fn();

vi.mock("@/hooks/use-form-state", () => ({
  useFormState: () => mockUseFormState(),
}));

// Mock the actions
vi.mock("@/actions/auth-actions", () => ({
  passwordUpdateAction: vi.fn(),
  passwordChangeAction: vi.fn(),
}));

describe("PasswordResetForm", () => {
  beforeEach(() => {
    mockUseFormState.mockImplementation(() => ({
      state: {
        data: null,
        error: null,
        fieldErrors: {},
        isPending: false,
        isSuccess: false,
      },
      formAction: mockFormAction,
      reset: vi.fn(),
    }));
  });

  describe("rendering password and confirm password fields", () => {
    it("renders new password field", () => {
      render(<PasswordResetForm />);

      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    it("renders confirm password field", () => {
      render(<PasswordResetForm />);

      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<PasswordResetForm />);

      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toBeInTheDocument();
    });
  });

  describe("password strength indicator on new password", () => {
    it("new password field has strength indicator", () => {
      render(<PasswordResetForm />);

      // The PasswordInput with showStrength should have aria-describedby
      const newPasswordInput = screen.getByLabelText("New Password");
      expect(newPasswordInput).toHaveAttribute(
        "aria-describedby",
        "password-strength"
      );
    });

    it("confirm password field does not have strength indicator", () => {
      render(<PasswordResetForm />);

      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      expect(confirmPasswordInput).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("current password field when requireCurrentPassword=true", () => {
    it("renders current password field when required", () => {
      render(<PasswordResetForm requireCurrentPassword />);

      expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    });

    it("does not render current password field when not required", () => {
      render(<PasswordResetForm requireCurrentPassword={false} />);

      expect(
        screen.queryByLabelText("Current Password")
      ).not.toBeInTheDocument();
    });

    it("shows Change Password button when requireCurrentPassword=true", () => {
      render(<PasswordResetForm requireCurrentPassword />);

      expect(
        screen.getByRole("button", { name: "Change Password" })
      ).toBeInTheDocument();
    });

    it("shows Reset Password button when requireCurrentPassword=false", () => {
      render(<PasswordResetForm requireCurrentPassword={false} />);

      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toBeInTheDocument();
    });
  });

  describe("error display for mismatched passwords", () => {
    beforeEach(() => {
      mockUseFormState.mockImplementation(() => ({
        state: {
          data: null,
          error: null,
          fieldErrors: {
            confirmPassword: ["Passwords do not match"],
          },
          isPending: false,
          isSuccess: false,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));
    });

    it("displays error when passwords do not match", () => {
      render(<PasswordResetForm />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Passwords do not match"
      );
    });
  });

  describe("loading state on submit", () => {
    beforeEach(() => {
      mockUseFormState.mockImplementation(() => ({
        state: {
          data: null,
          error: null,
          fieldErrors: {},
          isPending: true,
          isSuccess: false,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));
    });

    it("shows loading state on button", () => {
      render(<PasswordResetForm />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Submitting...");
    });
  });

  describe("success callback invocation", () => {
    it("calls onSuccess when form is successful", () => {
      const onSuccess = vi.fn();

      mockUseFormState.mockImplementation(() => ({
        state: {
          data: { message: "Password updated" },
          error: null,
          fieldErrors: {},
          isPending: false,
          isSuccess: true,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));

      render(<PasswordResetForm onSuccess={onSuccess} />);

      expect(onSuccess).toHaveBeenCalled();
    });

    it("shows success message when no onSuccess callback provided", () => {
      mockUseFormState.mockImplementation(() => ({
        state: {
          data: { message: "Password updated successfully" },
          error: null,
          fieldErrors: {},
          isPending: false,
          isSuccess: true,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));

      render(<PasswordResetForm />);

      expect(screen.getByRole("status")).toHaveTextContent(
        "Password updated successfully"
      );
    });
  });

  describe("form-level error display", () => {
    beforeEach(() => {
      mockUseFormState.mockImplementation(() => ({
        state: {
          data: null,
          error: "Session has expired",
          fieldErrors: {},
          isPending: false,
          isSuccess: false,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));
    });

    it("displays form-level error message", () => {
      render(<PasswordResetForm />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Session has expired"
      );
    });
  });

  describe("password field errors", () => {
    beforeEach(() => {
      mockUseFormState.mockImplementation(() => ({
        state: {
          data: null,
          error: null,
          fieldErrors: {
            password: ["Password must be at least 12 characters"],
            currentPassword: ["Current password is incorrect"],
          },
          isPending: false,
          isSuccess: false,
        },
        formAction: mockFormAction,
        reset: vi.fn(),
      }));
    });

    it("displays error for weak password", () => {
      render(<PasswordResetForm />);

      const alerts = screen.getAllByRole("alert");
      expect(
        alerts.some((alert) =>
          alert.textContent?.includes("Password must be at least 12 characters")
        )
      ).toBe(true);
    });

    it("displays error for incorrect current password", () => {
      render(<PasswordResetForm requireCurrentPassword />);

      const alerts = screen.getAllByRole("alert");
      expect(
        alerts.some((alert) =>
          alert.textContent?.includes("Current password is incorrect")
        )
      ).toBe(true);
    });
  });
});
