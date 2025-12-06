import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroImageGrid from "@/components/shared/HeroImageGrid";

describe("HeroImageGrid", () => {
  describe("rendering", () => {
    it("renders 4 images", () => {
      render(<HeroImageGrid />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(4);
    });

    it("applies descriptive alt text to all images", () => {
      render(<HeroImageGrid />);

      expect(screen.getByAltText(/cozy coffee shop/i)).toBeInTheDocument();
      expect(screen.getByAltText(/tall library shelves/i)).toBeInTheDocument();
      expect(
        screen.getByAltText(/vibrant outdoor farmers market/i)
      ).toBeInTheDocument();
      expect(screen.getByAltText(/sunlit art gallery/i)).toBeInTheDocument();
    });

    it("uses correct placeholder URLs with color codes", () => {
      render(<HeroImageGrid />);

      const coffeeImage = screen.getByAltText(
        /cozy coffee shop/i
      ) as HTMLImageElement;
      expect(coffeeImage.src).toContain("placehold.co");
      expect(coffeeImage.src).toContain("ff6b35"); // Orange color
    });

    it("ensures all images have non-empty alt attributes", () => {
      render(<HeroImageGrid />);
      const images = screen.getAllByRole("img");

      images.forEach((img) => {
        expect(img).toHaveAttribute("alt");
        expect(img.getAttribute("alt")).not.toBe("");
      });
    });

    it("applies rounded-lg class to all images", () => {
      render(<HeroImageGrid />);
      const images = screen.getAllByRole("img");

      images.forEach((img) => {
        expect(img.className).toContain("rounded-lg");
      });
    });

    it("applies object-cover class to all images", () => {
      render(<HeroImageGrid />);
      const images = screen.getAllByRole("img");

      images.forEach((img) => {
        expect(img.className).toContain("object-cover");
      });
    });
  });

  describe("responsive layout", () => {
    it("applies grid-cols-1 for mobile layout", () => {
      const { container } = render(<HeroImageGrid />);
      const gridContainer = container.firstChild as HTMLElement;

      expect(gridContainer.className).toContain("grid-cols-1");
    });

    it("applies md:grid-cols-2 for desktop layout", () => {
      const { container } = render(<HeroImageGrid />);
      const gridContainer = container.firstChild as HTMLElement;

      expect(gridContainer.className).toContain("md:grid-cols-2");
    });

    it("library image has md:row-span-2 class", () => {
      const { container } = render(<HeroImageGrid />);
      const libraryWrapper = container.querySelector(
        '[class*="md:row-span-2"]'
      );

      expect(libraryWrapper).toBeInTheDocument();
    });

    it("gallery image has md:col-span-2 class", () => {
      const { container } = render(<HeroImageGrid />);
      const galleryWrapper = container.querySelector(
        '[class*="md:col-span-2"]'
      );

      expect(galleryWrapper).toBeInTheDocument();
    });
  });
});
