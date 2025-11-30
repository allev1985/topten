import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormInput } from "@/components/auth/form-input";

describe("FormInput", () => {
  describe("rendering", () => {
    it("renders label and input", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with correct input type", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("renders with text type", () => {
      render(<FormInput id="name" name="name" type="text" label="Name" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("renders with correct name attribute", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
    });
  });

  describe("error message display", () => {
    it("displays error message when provided", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          error="Invalid email format"
        />
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email format"
      );
    });

    it("does not display error when not provided", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("ARIA attributes", () => {
    it("sets aria-invalid when error exists", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          error="Invalid email"
        />
      );

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("does not set aria-invalid when no error", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    });

    it("sets aria-describedby to error element when error exists", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          error="Invalid email"
        />
      );

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        "email-error"
      );
    });

    it("does not set aria-describedby when no error", () => {
      render(<FormInput id="email" name="email" type="email" label="Email" />);

      expect(screen.getByRole("textbox")).not.toHaveAttribute(
        "aria-describedby"
      );
    });
  });

  describe("required attribute handling", () => {
    it("sets required attribute when required is true", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          required
        />
      );

      expect(screen.getByRole("textbox")).toHaveAttribute("required");
    });

    it("does not set required attribute when required is false", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          required={false}
        />
      );

      expect(screen.getByRole("textbox")).not.toHaveAttribute("required");
    });
  });

  describe("default value handling", () => {
    it("sets default value", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          defaultValue="test@example.com"
        />
      );

      expect(screen.getByRole("textbox")).toHaveValue("test@example.com");
    });
  });

  describe("autocomplete attribute", () => {
    it("sets autocomplete attribute", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
        />
      );

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "autocomplete",
        "email"
      );
    });
  });

  describe("placeholder", () => {
    it("sets placeholder attribute", () => {
      render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
        />
      );

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Enter your email"
      );
    });
  });

  describe("className passthrough", () => {
    it("applies className to wrapper", () => {
      const { container } = render(
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
