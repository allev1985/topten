import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard } from "@/components/auth/auth-card";

describe("AuthCard", () => {
  describe("rendering with title and children", () => {
    it("renders title", () => {
      render(
        <AuthCard title="Sign In">
          <p>Form content</p>
        </AuthCard>
      );

      expect(
        screen.getByRole("heading", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("renders children content", () => {
      render(
        <AuthCard title="Sign In">
          <p>Form content</p>
        </AuthCard>
      );

      expect(screen.getByText("Form content")).toBeInTheDocument();
    });
  });

  describe("optional description display", () => {
    it("renders description when provided", () => {
      render(
        <AuthCard title="Sign In" description="Enter your credentials">
          <p>Form</p>
        </AuthCard>
      );

      expect(screen.getByText("Enter your credentials")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      // Only the title should be in header, no paragraph
      const header = container.querySelector("header");
      const paragraphs = header?.querySelectorAll("p");
      expect(paragraphs?.length || 0).toBe(0);
    });
  });

  describe("optional footer content", () => {
    it("renders footer when provided", () => {
      render(
        <AuthCard title="Sign In" footer={<a href="/signup">Create account</a>}>
          <p>Form</p>
        </AuthCard>
      );

      expect(screen.getByRole("link")).toHaveTextContent("Create account");
    });

    it("does not render footer when not provided", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("footer")).not.toBeInTheDocument();
    });

    it("renders complex footer content", () => {
      render(
        <AuthCard
          title="Sign In"
          footer={
            <div>
              <a href="/signup">Sign up</a>
              <a href="/forgot-password">Forgot password?</a>
            </div>
          }
        >
          <p>Form</p>
        </AuthCard>
      );

      expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Forgot password?" })
      ).toBeInTheDocument();
    });
  });

  describe("semantic HTML structure", () => {
    it("uses main element as wrapper", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("uses article element for content", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("uses header element for title section", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("header")).toBeInTheDocument();
    });

    it("uses h1 for title", () => {
      render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Sign In"
      );
    });

    it("uses section element for children content", () => {
      const { container } = render(
        <AuthCard title="Sign In">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("uses footer element when footer prop provided", () => {
      const { container } = render(
        <AuthCard title="Sign In" footer={<p>Footer</p>}>
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("footer")).toBeInTheDocument();
    });
  });

  describe("className passthrough", () => {
    it("applies className to main wrapper", () => {
      const { container } = render(
        <AuthCard title="Sign In" className="custom-class">
          <p>Form</p>
        </AuthCard>
      );

      expect(container.querySelector("main")).toHaveClass("custom-class");
    });
  });
});
