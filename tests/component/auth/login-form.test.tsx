import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock the loginAction
vi.mock("@/actions/auth-actions", () => ({
  loginAction: vi.fn(),
}));

// Mock state holder - we'll update this in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any = {
  data: null,
  error: null,
  fieldErrors: {},
  isPending: false,
  isSuccess: false,
};

const mockFormAction = vi.fn();

// Mock useFormState to return predictable state
vi.mock("@/hooks/use-form-state", () => ({
  useFormState: () => ({
    state: mockState,
    formAction: mockFormAction,
    reset: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    // Reset to default state before each test
    mockState = {
      data: null,
      error: null,
      fieldErrors: {},
      isPending: false,
      isSuccess: false,
    };
  });

  describe("rendering", () => {
    it("renders all form fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("renders Remember me checkbox", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText("Remember me")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders email input with correct attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("autocomplete", "email");
    });

    it("renders password input with correct attributes", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });
  });

  describe("defaultEmail prop handling", () => {
    it("sets default email value when provided", () => {
      render(<LoginForm defaultEmail="test@example.com" />);

      expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
    });

    it("renders without default email when not provided", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText("Email")).toHaveValue("");
    });
  });

  describe("redirectTo passthrough in hidden input", () => {
    it("renders hidden redirectTo input when provided", () => {
      const { container } = render(<LoginForm redirectTo="/settings" />);

      const hiddenInput = container.querySelector('input[name="redirectTo"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute("type", "hidden");
      expect(hiddenInput).toHaveAttribute("value", "/settings");
    });

    it("does not render hidden input when redirectTo not provided", () => {
      const { container } = render(<LoginForm />);

      const hiddenInput = container.querySelector('input[name="redirectTo"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("form exists in document", () => {
      const { container } = render(<LoginForm />);

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
    });

    it("submit button has correct type", () => {
      render(<LoginForm />);

      expect(screen.getByRole("button", { name: "Sign In" })).toHaveAttribute(
        "type",
        "submit"
      );
    });
  });
});

describe("LoginForm with error state", () => {
  beforeEach(() => {
    mockState = {
      data: null,
      error: "Invalid email or password",
      fieldErrors: {},
      isPending: false,
      isSuccess: false,
    };
  });

  it("displays error message for invalid credentials", () => {
    render(<LoginForm />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid email or password"
    );
  });
});

describe("LoginForm with field errors", () => {
  beforeEach(() => {
    mockState = {
      data: null,
      error: null,
      fieldErrors: {
        email: ["Invalid email format"],
        password: ["Password is required"],
      },
      isPending: false,
      isSuccess: false,
    };
  });

  it("displays field-level error for email", () => {
    render(<LoginForm />);

    const alerts = screen.getAllByRole("alert");
    expect(
      alerts.some((alert) => alert.textContent === "Invalid email format")
    ).toBe(true);
  });

  it("displays field-level error for password", () => {
    render(<LoginForm />);

    const alerts = screen.getAllByRole("alert");
    expect(
      alerts.some((alert) => alert.textContent === "Password is required")
    ).toBe(true);
  });
});

describe("LoginForm with loading state", () => {
  beforeEach(() => {
    mockState = {
      data: null,
      error: null,
      fieldErrors: {},
      isPending: true,
      isSuccess: false,
    };
  });

  it("shows loading state on submit button", () => {
    render(<LoginForm />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Submitting...");
  });
});
