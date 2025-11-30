import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorMessage } from "@/components/auth/error-message";

describe("ErrorMessage", () => {
  describe("rendering with message", () => {
    it("renders when message is provided", () => {
      render(<ErrorMessage message="Something went wrong" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("displays the message text", () => {
      render(<ErrorMessage message="Invalid credentials" />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials"
      );
    });
  });

  describe("not rendering when message is null/undefined", () => {
    it("does not render when message is null", () => {
      render(<ErrorMessage message={null} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not render when message is undefined", () => {
      render(<ErrorMessage message={undefined} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not render when message is empty string", () => {
      render(<ErrorMessage message="" />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("role=alert accessibility attribute", () => {
    it("has role alert for screen reader announcements", () => {
      render(<ErrorMessage message="Error occurred" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("role", "alert");
    });
  });

  describe("className passthrough", () => {
    it("applies className when provided", () => {
      render(<ErrorMessage message="Error" className="error-class" />);

      expect(screen.getByRole("alert")).toHaveClass("error-class");
    });

    it("renders without className when not provided", () => {
      render(<ErrorMessage message="Error" />);

      expect(screen.getByRole("alert")).not.toHaveAttribute("class");
    });
  });
});
