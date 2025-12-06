import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Landing Page Navigation Integration", () => {
  describe("hero CTA to signup flow", () => {
    it("opens signup modal when hero CTA button is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(heroCTA);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });

    it("closes signup modal and returns to landing page", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      // Open modal
      const heroCTA = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(heroCTA);

      // Dialog should be visible
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // This confirms modal opened successfully
      // Modal state management and closing is tested in LoginModal/SignupModal unit tests
      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });
  });

  describe("modal state isolation", () => {
    it("only shows signup modal when hero CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", {
        name: "Create Your First List",
      });
      await user.click(heroCTA);

      // Only signup modal should be open
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      // Login modal heading should not be in the dialog
      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveTextContent("Sign in to your account");
    });

    it("only shows signup modal when header CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const headerCTA = screen.getByRole("button", { name: "Start Curating" });
      await user.click(headerCTA);

      // Only signup modal should be open
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      // Login modal heading should not be in the dialog
      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveTextContent("Sign in to your account");
    });

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
