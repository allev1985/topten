import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordInput } from "@/components/auth/password-input";

// Mock the validatePassword function
vi.mock("@/lib/utils/validation/password", () => ({
  validatePassword: vi.fn((password: string) => {
    // Simple mock implementation for testing
    const length = password.length;
    if (length >= 12) {
      return { strength: "strong" as const };
    } else if (length >= 8) {
      return { strength: "medium" as const };
    }
    return { strength: "weak" as const };
  }),
}));

describe("PasswordInput", () => {
  describe("rendering", () => {
    it("renders label and password input", () => {
      render(<PasswordInput id="password" name="password" label="Password" />);

      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "type",
        "password"
      );
    });

    it("renders with correct name attribute", () => {
      render(<PasswordInput id="password" name="password" label="Password" />);

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "name",
        "password"
      );
    });
  });

  describe("password strength indicator", () => {
    it("does not show strength indicator when showStrength is false", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength={false}
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });

    it("shows strength indicator when showStrength is true and has input", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.getByText(/Password strength:/)).toBeInTheDocument();
    });

    it("does not show strength indicator when input is empty", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });

    it("updates strength on input change - weak", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "weak" } });

      expect(screen.getByText(/weak/)).toBeInTheDocument();
    });

    it("updates strength on input change - medium", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "mediumpass" } });

      expect(screen.getByText(/medium/)).toBeInTheDocument();
    });

    it("updates strength on input change - strong", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "StrongPassword123!" } });

      expect(screen.getByText(/strong/)).toBeInTheDocument();
    });

    it("uses custom strength label", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
          strengthLabel="Strength level"
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.getByText(/Strength level:/)).toBeInTheDocument();
    });
  });

  describe("error message display", () => {
    it("displays error message when provided", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          error="Password is required"
        />
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Password is required"
      );
    });

    it("does not display error when not provided", () => {
      render(<PasswordInput id="password" name="password" label="Password" />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("ARIA attributes", () => {
    it("sets aria-invalid when error exists", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          error="Invalid"
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("does not set aria-invalid when no error", () => {
      render(<PasswordInput id="password" name="password" label="Password" />);

      expect(screen.getByLabelText("Password")).not.toHaveAttribute(
        "aria-invalid"
      );
    });

    it("has aria-live on strength indicator", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      const input = screen.getByLabelText("Password");
      fireEvent.change(input, { target: { value: "test" } });

      const strengthIndicator = screen.getByText(/Password strength:/);
      expect(strengthIndicator).toHaveAttribute("aria-live", "polite");
    });

    it("sets aria-describedby with error when error exists", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          error="Error"
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-describedby",
        "password-error"
      );
    });

    it("sets aria-describedby with strength when showStrength is true", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-describedby",
        "password-strength"
      );
    });

    it("sets aria-describedby with both error and strength", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          showStrength
          error="Error"
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-describedby",
        "password-error password-strength"
      );
    });
  });

  describe("required attribute", () => {
    it("sets required attribute when required is true", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          required
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute("required");
    });
  });

  describe("autocomplete attribute", () => {
    it("sets autocomplete to current-password", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "autocomplete",
        "current-password"
      );
    });

    it("sets autocomplete to new-password", () => {
      render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
        />
      );

      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "autocomplete",
        "new-password"
      );
    });
  });

  describe("className passthrough", () => {
    it("applies className to wrapper", () => {
      const { container } = render(
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
