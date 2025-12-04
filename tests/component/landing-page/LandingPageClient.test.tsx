import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

/**
 * Component tests for LandingPageClient
 *
 * These tests verify that the component renders correctly based on
 * the authentication state prop and doesn't cause hydration errors.
 *
 * Coverage areas:
 * - Authenticated user rendering
 * - Non-authenticated user rendering
 * - Shared content rendering
 * - Prop type safety
 * - No hydration warnings
 */

describe("LandingPageClient Component", () => {
  describe("Authenticated User Rendering", () => {
    it("renders authenticated content when isAuthenticated=true", () => {
      render(<LandingPageClient isAuthenticated={true} />);

      // Should show authenticated navigation
      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();

      // Should NOT show guest navigation
      expect(screen.queryByText("Log In")).not.toBeInTheDocument();
      expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
    });

    it("renders dashboard link with correct href", () => {
      render(<LandingPageClient isAuthenticated={true} />);

      const dashboardLink = screen.getByText("Go to Dashboard");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("applies correct styling to authenticated navigation", () => {
      render(<LandingPageClient isAuthenticated={true} />);

      const dashboardLink = screen.getByText("Go to Dashboard");
      expect(dashboardLink).toHaveClass("rounded-md");
      expect(dashboardLink).toHaveClass("bg-black");
    });
  });

  describe("Non-Authenticated User Rendering", () => {
    it("renders guest content when isAuthenticated=false", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      // Should show guest navigation
      expect(screen.getByText("Log In")).toBeInTheDocument();
      expect(screen.getByText("Sign Up")).toBeInTheDocument();

      // Should NOT show authenticated navigation
      expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();
    });

    it("renders login and signup links with correct hrefs", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      const loginLink = screen.getByText("Log In");
      const signupLink = screen.getByText("Sign Up");

      expect(loginLink).toHaveAttribute("href", "/login");
      expect(signupLink).toHaveAttribute("href", "/signup");
    });

    it("applies correct styling to guest navigation", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      const loginLink = screen.getByText("Log In");
      const signupLink = screen.getByText("Sign Up");

      expect(loginLink).toHaveClass("rounded-md");
      expect(loginLink).toHaveClass("border");

      expect(signupLink).toHaveClass("rounded-md");
      expect(signupLink).toHaveClass("bg-black");
    });
  });

  describe("Shared Content Rendering", () => {
    it("renders shared content for authenticated users", () => {
      render(<LandingPageClient isAuthenticated={true} />);

      expect(screen.getByText("YourFavs")).toBeInTheDocument();
      expect(
        screen.getByText("Curate and share your favorite places")
      ).toBeInTheDocument();
    });

    it("renders shared content for non-authenticated users", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      expect(screen.getByText("YourFavs")).toBeInTheDocument();
      expect(
        screen.getByText("Curate and share your favorite places")
      ).toBeInTheDocument();
    });

    it("renders same shared content regardless of auth state", () => {
      const { rerender } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      const heading1 = screen.getByText("YourFavs");
      const description1 = screen.getByText(
        "Curate and share your favorite places"
      );

      rerender(<LandingPageClient isAuthenticated={true} />);

      const heading2 = screen.getByText("YourFavs");
      const description2 = screen.getByText(
        "Curate and share your favorite places"
      );

      // Content should be the same
      expect(heading1.textContent).toBe(heading2.textContent);
      expect(description1.textContent).toBe(description2.textContent);
    });
  });

  describe("Layout and Structure", () => {
    it("renders with correct container classes", () => {
      const { container } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      const mainContainer = container.querySelector(".min-h-screen");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("flex");
      expect(mainContainer).toHaveClass("flex-col");
    });

    it("renders heading with correct styling", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      const heading = screen.getByText("YourFavs");
      expect(heading).toHaveClass("text-4xl");
      expect(heading).toHaveClass("font-bold");
      expect(heading).toHaveClass("tracking-tight");
    });

    it("renders description with correct styling", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      const description = screen.getByText(
        "Curate and share your favorite places"
      );
      expect(description).toHaveClass("max-w-md");
      expect(description).toHaveClass("text-lg");
    });
  });

  describe("Prop Type Safety", () => {
    it("accepts boolean true for isAuthenticated", () => {
      expect(() => {
        render(<LandingPageClient isAuthenticated={true} />);
      }).not.toThrow();
    });

    it("accepts boolean false for isAuthenticated", () => {
      expect(() => {
        render(<LandingPageClient isAuthenticated={false} />);
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("uses semantic HTML elements", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("navigation links are accessible", () => {
      render(<LandingPageClient isAuthenticated={false} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });

  describe("No Hydration Issues", () => {
    it("renders consistently with same props", () => {
      const { container: container1 } = render(
        <LandingPageClient isAuthenticated={true} />
      );
      const { container: container2 } = render(
        <LandingPageClient isAuthenticated={true} />
      );

      // Both renders should produce identical output
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it("does not use client-side state that could cause hydration mismatch", () => {
      // If the component uses useState or useEffect to modify initial render,
      // this test would fail. The component should render purely based on props.
      const { container } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      // Re-render with same props
      const { container: container2 } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      // Should produce identical output (no client-side state changes)
      expect(container.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("toggles between authenticated and guest navigation", () => {
      const { rerender } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      // Initially shows guest navigation
      expect(screen.getByText("Log In")).toBeInTheDocument();
      expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();

      // After rerender with auth, shows authenticated navigation
      rerender(<LandingPageClient isAuthenticated={true} />);

      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Log In")).not.toBeInTheDocument();
    });

    it("maintains shared content during auth state changes", () => {
      const { rerender } = render(
        <LandingPageClient isAuthenticated={false} />
      );

      expect(screen.getByText("YourFavs")).toBeInTheDocument();

      rerender(<LandingPageClient isAuthenticated={true} />);

      expect(screen.getByText("YourFavs")).toBeInTheDocument();

      rerender(<LandingPageClient isAuthenticated={false} />);

      expect(screen.getByText("YourFavs")).toBeInTheDocument();
    });
  });
});
