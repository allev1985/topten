import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Responsive Layout", () => {
  describe("desktop layout", () => {
    it("applies grid layout classes for two-column display", () => {
      const { container } = render(<LandingPageClient />);
      const gridContainer = container.querySelector(".grid");

      expect(gridContainer?.className).toContain("grid-cols-1");
      expect(gridContainer?.className).toContain("lg:grid-cols-5");
    });

    it("allocates correct column spans for text and images", () => {
      const { container } = render(<LandingPageClient />);

      // Text column should be col-span-1 lg:col-span-2
      const textColumn = screen
        .getByRole("heading", { level: 1 })
        .closest(".col-span-1");
      expect(textColumn?.className).toContain("lg:col-span-2");

      // Image column should be col-span-1 lg:col-span-3
      const imageColumn = container.querySelector(".lg\\:col-span-3");
      expect(imageColumn).toBeInTheDocument();
    });
  });

  describe("mobile layout", () => {
    it("stacks content vertically on mobile", () => {
      const { container } = render(<LandingPageClient />);
      const gridContainer = container.querySelector(".grid");

      // Both columns should have col-span-1 (full width on mobile)
      expect(gridContainer?.className).toContain("grid-cols-1");
    });
  });

  describe("spacing and padding", () => {
    it("applies responsive padding to main element", () => {
      const { container } = render(<LandingPageClient />);
      const main = container.querySelector("main");

      expect(main?.className).toContain("px-4");
      expect(main?.className).toContain("md:px-8");
      expect(main?.className).toContain("py-12");
      expect(main?.className).toContain("md:py-16");
    });

    it("constrains content to max-width", () => {
      const { container } = render(<LandingPageClient />);
      const heroContainer = container.querySelector(".max-w-7xl");

      expect(heroContainer).toBeInTheDocument();
    });
  });
});
