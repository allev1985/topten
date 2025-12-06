import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Accessibility", () => {
  describe("heading hierarchy", () => {
    it("has exactly one h1 element", () => {
      render(<LandingPageClient />);
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it("uses h1 for the main headline", () => {
      render(<LandingPageClient />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Curate and share your favourite places");
    });
  });

  describe("interactive elements", () => {
    it("CTA button is keyboard focusable", () => {
      render(<LandingPageClient />);
      const ctaButton = screen.getByRole("button", {
        name: "Create Your First List",
      });

      ctaButton.focus();
      expect(ctaButton).toHaveFocus();
    });

    it("CTA button has accessible name", () => {
      render(<LandingPageClient />);
      const ctaButton = screen.getByRole("button", {
        name: "Create Your First List",
      });

      expect(ctaButton).toHaveAccessibleName("Create Your First List");
    });
  });

  describe("decorative elements", () => {
    it("marks sparkles icon as decorative", () => {
      const { container } = render(<LandingPageClient />);
      const sparklesIcon = container.querySelector('[aria-hidden="true"]');

      expect(sparklesIcon).toBeInTheDocument();
    });
  });

  describe("semantic HTML", () => {
    it("uses button element for CTA", () => {
      render(<LandingPageClient />);
      const cta = screen.getByRole("button", {
        name: "Create Your First List",
      });

      expect(cta.tagName).toBe("BUTTON");
    });

    it("uses main landmark for primary content", () => {
      render(<LandingPageClient />);
      const main = screen.getByRole("main");

      expect(main).toBeInTheDocument();
    });
  });
});
