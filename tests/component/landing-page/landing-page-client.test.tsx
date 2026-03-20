import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

const mockPush = vi.fn();

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LandingPageClient", () => {
  describe("hero text content", () => {
    it("displays the brand logo", () => {
      const { container } = render(<LandingPageClient />);
      expect(
        container.querySelector('[aria-label="myfaves"]')
      ).toBeInTheDocument();
    });

    it("displays the headline as h1", () => {
      render(<LandingPageClient />);
      const headline = screen.getByRole("heading", { level: 1 });
      expect(headline).toHaveTextContent(
        "Curate and share your favourite places"
      );
    });

    it("displays the subheading", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByText(/Build focused, meaningful collections/i)
      ).toBeInTheDocument();
    });

    it("displays the CTA button", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByRole("button", { name: "Create Your First List" })
      ).toBeInTheDocument();
    });
  });

  describe("hero section interactions", () => {
    it("navigates to /signup when hero CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const ctaButton = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(ctaButton);

      expect(mockPush).toHaveBeenCalledWith("/signup");
    });
  });

  describe("semantic structure", () => {
    it("uses main element for hero section", () => {
      const { container } = render(<LandingPageClient />);
      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("has proper heading hierarchy", () => {
      render(<LandingPageClient />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Curate and share your favourite places");
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
      const heading = screen.getByRole("heading", { level: 1 });
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
        screen.getByRole("heading", {
          name: "Curate and share your favourite places",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Build focused, meaningful collections/i)
      ).toBeInTheDocument();
    });
  });
});
