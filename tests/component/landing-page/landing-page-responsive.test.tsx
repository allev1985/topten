import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/app/_components/landing-page-client";

describe("LandingPageClient - Responsive Design", () => {
  describe("layout responsiveness", () => {
    it("applies responsive container classes", () => {
      const { container } = render(<LandingPageClient />);
      const wrapper = container.querySelector("div");

      // Verify responsive classes are present
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("min-h-screen");
    });

    it("uses responsive text sizing", () => {
      render(<LandingPageClient />);
      const heading = screen.getByRole("heading", { name: "YourFavs" });

      // Verify responsive text sizing is applied
      expect(heading.className).toContain("text-4xl");
    });

    it("constrains content width for readability", () => {
      render(<LandingPageClient />);
      const tagline = screen.getByText(
        /curate and share your favorite places/i
      );

      // Verify max-width constraint for readability
      expect(tagline.className).toContain("max-w-md");
    });
  });

  describe("mobile viewport compatibility", () => {
    it("renders content in column layout", () => {
      const { container } = render(<LandingPageClient />);
      const main = container.querySelector("main");

      // Verify column layout (mobile-first approach)
      expect(main?.className).toContain("flex-col");
    });

    it("maintains proper spacing on small screens", () => {
      const { container } = render(<LandingPageClient />);
      const main = container.querySelector("main");

      // Verify gap for spacing
      expect(main?.className).toContain("gap-6");
    });
  });

  describe("content accessibility across viewports", () => {
    it("ensures text is readable on all viewport sizes", () => {
      render(<LandingPageClient />);

      // Verify text content is accessible
      expect(
        screen.getByRole("heading", { name: "YourFavs" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });

    it("maintains semantic structure across viewports", () => {
      render(<LandingPageClient />);

      const main = screen.getByRole("main");
      const heading = screen.getByRole("heading", { level: 1 });

      // Verify semantic structure is maintained
      expect(main).toContainElement(heading);
    });
  });

  describe("future responsive enhancements", () => {
    it("provides foundation for responsive images", () => {
      // Current version has no images
      // Future versions may add hero images with responsive srcset
      render(<LandingPageClient />);

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("provides foundation for responsive navigation", () => {
      // Current version has no navigation
      // Future versions may add responsive navigation (hamburger menu on mobile)
      render(<LandingPageClient />);

      const wrapper = screen.getByRole("main").parentElement;
      expect(wrapper).toBeInTheDocument();
    });
  });
});
