import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Landing Page Navigation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hero CTA to signup flow", () => {
    it("navigates to /signup when hero CTA button is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(heroCTA);

      expect(mockPush).toHaveBeenCalledWith("/signup");
    });

    it("navigates to /signup when header CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const headerCTA = screen.getByRole("button", { name: "Start Curating" });
      await user.click(headerCTA);

      expect(mockPush).toHaveBeenCalledWith("/signup");
    });

    it("does not open a modal when hero CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(heroCTA);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("modal state isolation", () => {
    it("only shows login modal when header login is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const loginButton = screen.getByRole("button", { name: "Log In" });
      await user.click(loginButton);

      // Only login modal should be open - check for login-specific text
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveTextContent("Enter your credentials");
      // Signup modal text should not be present
      expect(screen.queryByText("Create your account")).not.toBeInTheDocument();
    });
  });

  describe("page structure", () => {
    it("provides navigable content structure", () => {
      render(<LandingPageClient />);

      // Verify the main landmark is present for navigation
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("provides accessible heading for navigation", () => {
      render(<LandingPageClient />);

      // Verify the h1 heading is accessible for navigation
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(
        "Curate and share your favourite places"
      );
    });
  });

  describe("integration readiness", () => {
    it("renders consistently for navigation scenarios", () => {
      // Render multiple times to ensure consistent rendering
      // (important for navigation between pages)
      const { unmount } = render(<LandingPageClient />);
      expect(
        screen.getByRole("heading", {
          name: "Curate and share your favourite places",
        })
      ).toBeInTheDocument();
      unmount();

      render(<LandingPageClient />);
      expect(
        screen.getByRole("heading", {
          name: "Curate and share your favourite places",
        })
      ).toBeInTheDocument();
    });

    it("maintains semantic structure for screen readers during navigation", () => {
      render(<LandingPageClient />);

      // Verify semantic structure that helps with navigation
      const main = screen.getByRole("main");
      const heading = screen.getByRole("heading", { level: 1 });

      expect(main).toContainElement(heading);
    });
  });
});
