import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/app/_components/landing-page-client";

describe("LandingPageClient Accessibility", () => {
  describe("semantic HTML", () => {
    it("uses proper heading hierarchy", () => {
      render(<LandingPageClient />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("YourFavs");
    });

    it("uses main landmark for primary content", () => {
      render(<LandingPageClient />);
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("text content", () => {
    it("provides meaningful heading text", () => {
      render(<LandingPageClient />);
      const heading = screen.getByRole("heading", { name: "YourFavs" });
      expect(heading).toBeVisible();
    });

    it("provides descriptive tagline", () => {
      render(<LandingPageClient />);
      const tagline = screen.getByText(
        /curate and share your favorite places/i
      );
      expect(tagline).toBeVisible();
    });
  });

  describe("keyboard navigation", () => {
    it("renders content that is keyboard accessible", () => {
      const { container } = render(<LandingPageClient />);
      // The landing page should be accessible via keyboard navigation
      // Since there are no interactive elements in v1, we just verify the content is present
      expect(container.querySelector("main")).toBeInTheDocument();
    });
  });

  describe("screen reader compatibility", () => {
    it("has accessible text content for screen readers", () => {
      render(<LandingPageClient />);
      // Verify that screen readers can access the text content
      expect(screen.getByText("YourFavs")).toBeInTheDocument();
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });
  });
});
