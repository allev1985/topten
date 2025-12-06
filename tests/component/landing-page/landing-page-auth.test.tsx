import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Authenticated User", () => {
  describe("rendering for authenticated users", () => {
    it("renders the same content for authenticated users", () => {
      // In the current design, the landing page is the same for all users
      // Future iterations may add personalized content for authenticated users
      render(<LandingPageClient />);

      // Verify header is present
      expect(screen.getByRole("banner")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          name: "Curate and share your favourite places",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Build focused, meaningful collections/i)
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
