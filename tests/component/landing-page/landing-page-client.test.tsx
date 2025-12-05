import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

describe("LandingPageClient", () => {
  describe("branding display", () => {
    it("renders the YourFavs title", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByRole("heading", { name: "YourFavs" })
      ).toBeInTheDocument();
    });

    it("renders the tagline", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });
  });

  describe("semantic structure", () => {
    it("uses main element for primary content", () => {
      const { container } = render(<LandingPageClient />);
      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("uses h1 element for the heading", () => {
      render(<LandingPageClient />);
      const heading = screen.getByRole("heading", { name: "YourFavs" });
      expect(heading.tagName).toBe("H1");
    });
  });

  describe("styling", () => {
    it("applies correct container classes", () => {
      const { container } = render(<LandingPageClient />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.className).toContain("min-h-screen");
      expect(wrapper?.className).toContain("flex-col");
    });

    it("applies responsive text sizing", () => {
      render(<LandingPageClient />);
      const heading = screen.getByRole("heading", { name: "YourFavs" });
      expect(heading.className).toContain("text-4xl");
    });
  });

  describe("rendering", () => {
    it("renders without errors", () => {
      expect(() => render(<LandingPageClient />)).not.toThrow();
    });

    it("renders all expected content", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByRole("heading", { name: "YourFavs" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });
  });
});
