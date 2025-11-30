import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormButton } from "@/components/auth/form-button";

describe("FormButton", () => {
  describe("rendering", () => {
    it("renders with children text", () => {
      render(<FormButton>Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveTextContent("Submit");
    });

    it("renders with JSX children", () => {
      render(
        <FormButton>
          <span>Click me</span>
        </FormButton>
      );

      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });
  });

  describe("disabled state when pending", () => {
    it("is disabled when pending is true", () => {
      render(<FormButton pending>Submit</FormButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("is not disabled when pending is false", () => {
      render(<FormButton pending={false}>Submit</FormButton>);

      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("shows loading text when pending", () => {
      render(<FormButton pending>Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveTextContent("Submitting...");
    });

    it("shows children when not pending", () => {
      render(<FormButton>Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveTextContent("Submit");
    });
  });

  describe("disabled prop", () => {
    it("is disabled when disabled prop is true", () => {
      render(<FormButton disabled>Submit</FormButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("is disabled when both disabled and pending are true", () => {
      render(
        <FormButton disabled pending>
          Submit
        </FormButton>
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("click handler invocation", () => {
    it("calls onClick when clicked", () => {
      const handleClick = vi.fn();
      render(
        <FormButton type="button" onClick={handleClick}>
          Click
        </FormButton>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
      const handleClick = vi.fn();
      render(
        <FormButton type="button" onClick={handleClick} disabled>
          Click
        </FormButton>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when pending", () => {
      const handleClick = vi.fn();
      render(
        <FormButton type="button" onClick={handleClick} pending>
          Click
        </FormButton>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("button type attribute", () => {
    it("defaults to type submit", () => {
      render(<FormButton>Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("can be set to type button", () => {
      render(<FormButton type="button">Click</FormButton>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });
  });

  describe("aria-busy attribute", () => {
    it("sets aria-busy when pending", () => {
      render(<FormButton pending>Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("does not set aria-busy when not pending", () => {
      render(<FormButton>Submit</FormButton>);

      expect(screen.getByRole("button")).not.toHaveAttribute(
        "aria-busy",
        "true"
      );
    });
  });

  describe("className passthrough", () => {
    it("applies className to button", () => {
      render(<FormButton className="custom-class">Submit</FormButton>);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });
  });
});
