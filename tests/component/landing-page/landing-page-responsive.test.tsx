import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
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
      expect(gridContainer?.className).toContain("lg:grid-cols-2");
    });

    it("renders two columns inside the grid", () => {
      const { container } = render(<LandingPageClient />);
      const gridContainer = container.querySelector(".grid");

      expect(gridContainer).not.toBeNull();
      const columns = gridContainer!.children;

      expect(columns).toHaveLength(2);
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
      expect(main?.className).toContain("py-8");
    });

    it("constrains content to max-width", () => {
      const { container } = render(<LandingPageClient />);
      const heroContainer = container.querySelector(".max-w-7xl");

      expect(heroContainer).toBeInTheDocument();
    });
  });
});
