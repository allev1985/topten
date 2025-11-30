import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";

describe("VerifyEmailPage", () => {
  describe("rendering of instructions", () => {
    it("renders the page title", () => {
      render(<VerifyEmailPage />);

      expect(
        screen.getByRole("heading", { name: "Check your email" })
      ).toBeInTheDocument();
    });

    it("renders verification instructions", () => {
      render(<VerifyEmailPage />);

      expect(
        screen.getByText(/click the verification link/i)
      ).toBeInTheDocument();
    });
  });

  describe("check spam folder messaging", () => {
    it("includes spam folder reminder", () => {
      render(<VerifyEmailPage />);

      expect(screen.getByText(/check your spam/i)).toBeInTheDocument();
    });

    it("includes junk folder mention", () => {
      render(<VerifyEmailPage />);

      expect(screen.getByText(/spam or junk folder/i)).toBeInTheDocument();
    });

    it("lists troubleshooting steps", () => {
      render(<VerifyEmailPage />);

      // Check that list items exist
      expect(screen.getByRole("list")).toBeInTheDocument();
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("accessible content structure", () => {
    it("has a main heading (h1)", () => {
      render(<VerifyEmailPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Check your email");
    });

    it("uses semantic HTML main element", () => {
      const { container } = render(<VerifyEmailPage />);

      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("uses semantic HTML article element", () => {
      const { container } = render(<VerifyEmailPage />);

      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("has link back to login", () => {
      render(<VerifyEmailPage />);

      const loginLink = screen.getByRole("link", { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("description text", () => {
    it("shows description about verification link", () => {
      render(<VerifyEmailPage />);

      expect(
        screen.getByText(/sent you a verification link/i)
      ).toBeInTheDocument();
    });
  });
});
