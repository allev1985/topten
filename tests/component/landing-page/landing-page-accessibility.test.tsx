import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

    it("uses banner landmark for header", () => {
      render(<LandingPageClient />);
      const banner = screen.getByRole("banner");
      expect(banner).toBeInTheDocument();
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
      // Header contains interactive elements (logo link and buttons)
      expect(container.querySelector("main")).toBeInTheDocument();
      expect(container.querySelector("header")).toBeInTheDocument();
    });
  });

  describe("screen reader compatibility", () => {
    it("has accessible text content for screen readers", () => {
      render(<LandingPageClient />);
      // Verify that screen readers can access the text content
      // Note: "YourFavs" appears twice - once in header logo, once in h1
      expect(screen.getAllByText("YourFavs")).toHaveLength(2);
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });
  });
});
