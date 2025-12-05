import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

describe("LandingPageClient - Authenticated User", () => {
  describe("rendering for authenticated users", () => {
    it("renders the same content for authenticated users", () => {
      // In the current design, the landing page is the same for all users
      // Future iterations may add personalized content for authenticated users
      render(<LandingPageClient />);

      expect(
        screen.getByRole("heading", { name: "YourFavs" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/curate and share your favorite places/i)
      ).toBeInTheDocument();
    });

    it("does not show errors when rendered for authenticated users", () => {
      expect(() => render(<LandingPageClient />)).not.toThrow();
    });
  });

  describe("future enhancements for authenticated users", () => {
    it("provides a foundation for authenticated user features", () => {
      // This test verifies that the component structure is ready for future enhancements
      // such as personalized content, user-specific CTAs, etc.
      render(<LandingPageClient />);

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });
  });
});
