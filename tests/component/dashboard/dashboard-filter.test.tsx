import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockGet = vi.fn(() => null);

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
    toString: () => "",
  }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock signOutAction
vi.mock("@/actions/auth-actions", () => ({
  signOutAction: vi.fn(() => Promise.resolve()),
}));

describe("DashboardPage - Filter Functionality", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGet.mockClear();
    mockGet.mockReturnValue(null);
  });

  describe("filter tabs rendering", () => {
    it("renders all filter tabs in main content", () => {
      const { container } = render(<DashboardPage />);

      // Get the main content area (which contains the filter tabs)
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();

      // Find tabs buttons (not the sidebar links)
      const tabs = container.querySelectorAll("button:not([aria-expanded])");
      const tabTexts = Array.from(tabs).map((tab) => tab.textContent);

      expect(tabTexts.some((text) => text?.includes("All Lists"))).toBe(true);
      expect(tabTexts.some((text) => text?.includes("Published"))).toBe(true);
      expect(tabTexts.some((text) => text?.includes("Drafts"))).toBe(true);
    });

    it("shows All Lists as active by default", () => {
      const { container } = render(<DashboardPage />);

      // Find all buttons with "All Lists" text
      const allListsButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "All Lists");

      // The filter tab button should have the active border styling
      const activeTab = allListsButtons.find(
        (btn) =>
          btn.className.includes("border-b-2") &&
          !btn.className.includes("border-transparent")
      );

      expect(activeTab).toBeTruthy();
    });
  });

  describe("filter tab interactions", () => {
    it("updates URL when Published tab is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(<DashboardPage />);

      // Find the Published button (not the sidebar link)
      const publishedButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "Published");
      const publishedTab = publishedButtons[0];

      expect(publishedTab).toBeTruthy();
      await user.click(publishedTab);

      expect(mockPush).toHaveBeenCalledWith("/dashboard?filter=published");
    });

    it("updates URL when Drafts tab is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(<DashboardPage />);

      // Find the Drafts button (not the sidebar link)
      const draftsButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "Drafts");
      const draftsTab = draftsButtons[0];

      expect(draftsTab).toBeTruthy();
      await user.click(draftsTab);

      expect(mockPush).toHaveBeenCalledWith("/dashboard?filter=drafts");
    });

    it("removes filter param when All Lists tab is clicked", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("published");

      const { container } = render(<DashboardPage />);

      // Find the All Lists button (not the sidebar link)
      const allListsButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "All Lists");
      const allListsTab = allListsButtons[0];

      expect(allListsTab).toBeTruthy();
      await user.click(allListsTab);

      expect(mockPush).toHaveBeenCalledWith("/dashboard?");
    });
  });

  describe("filter state from URL", () => {
    it("shows Published as active when filter=published in URL", () => {
      mockGet.mockReturnValue("published");
      const { container } = render(<DashboardPage />);

      // Find the Published button (not the sidebar link)
      const publishedButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "Published");
      const publishedTab = publishedButtons[0];

      expect(publishedTab).toBeTruthy();
      expect(publishedTab.className).toContain("border-b-2");
      expect(publishedTab.className).not.toContain("border-transparent");
    });

    it("shows Drafts as active when filter=drafts in URL", () => {
      mockGet.mockReturnValue("drafts");
      const { container } = render(<DashboardPage />);

      // Find the Drafts button (not the sidebar link)
      const draftsButtons = Array.from(
        container.querySelectorAll("button")
      ).filter((btn) => btn.textContent === "Drafts");
      const draftsTab = draftsButtons[0];

      expect(draftsTab).toBeTruthy();
      expect(draftsTab.className).toContain("border-b-2");
      expect(draftsTab.className).not.toContain("border-transparent");
    });
  });

  describe("list filtering", () => {
    it("shows all 5 lists when filter is 'all'", () => {
      render(<DashboardPage />);

      // Check for some of the mock lists
      expect(
        screen.getByText("Best Coffee Shops in San Francisco")
      ).toBeInTheDocument();
      expect(screen.getByText(/Hidden Gem Restaurants/)).toBeInTheDocument();
      expect(screen.getByText("Weekend Brunch Spots")).toBeInTheDocument();
      expect(screen.getByText("Craft Beer Bars Downtown")).toBeInTheDocument();
      expect(screen.getByText("New Places to Explore")).toBeInTheDocument();
    });

    it("shows only published lists when filter is 'published'", () => {
      mockGet.mockReturnValue("published");
      render(<DashboardPage />);

      // Should show published lists
      expect(
        screen.getByText("Best Coffee Shops in San Francisco")
      ).toBeInTheDocument();
      expect(screen.getByText("Weekend Brunch Spots")).toBeInTheDocument();
      expect(screen.getByText("Craft Beer Bars Downtown")).toBeInTheDocument();

      // Should not show draft lists
      expect(
        screen.queryByText(/Hidden Gem Restaurants/)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("New Places to Explore")
      ).not.toBeInTheDocument();
    });

    it("shows only draft lists when filter is 'drafts'", () => {
      mockGet.mockReturnValue("drafts");
      render(<DashboardPage />);

      // Should show draft lists
      expect(screen.getByText(/Hidden Gem Restaurants/)).toBeInTheDocument();
      expect(screen.getByText("New Places to Explore")).toBeInTheDocument();

      // Should not show published lists
      expect(
        screen.queryByText("Best Coffee Shops in San Francisco")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Weekend Brunch Spots")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Craft Beer Bars Downtown")
      ).not.toBeInTheDocument();
    });
  });

  describe("empty states", () => {
    it("does not show empty state when All Lists has results", () => {
      render(<DashboardPage />);

      // All lists should be visible
      expect(screen.queryByText("No lists yet")).not.toBeInTheDocument();
    });

    it("does not show empty state when Published has results", () => {
      mockGet.mockReturnValue("published");
      render(<DashboardPage />);

      // Published lists exist, so no empty state
      expect(
        screen.queryByText("No published lists yet")
      ).not.toBeInTheDocument();
    });

    it("does not show empty state when Drafts has results", () => {
      mockGet.mockReturnValue("drafts");
      render(<DashboardPage />);

      // Draft lists exist, so no empty state
      expect(screen.queryByText("No draft lists yet")).not.toBeInTheDocument();
    });
  });

  describe("integration with existing functionality", () => {
    it("still renders dashboard header with filter", () => {
      mockGet.mockReturnValue("published");
      render(<DashboardPage />);
      expect(screen.getByText("My Lists")).toBeInTheDocument();
    });

    it("still renders sidebar with filter", () => {
      mockGet.mockReturnValue("published");
      const { container } = render(<DashboardPage />);
      const aside = container.querySelector("aside");
      expect(aside).toBeInTheDocument();
    });

    it("still renders mobile navigation with filter", () => {
      mockGet.mockReturnValue("published");
      const { container } = render(<DashboardPage />);
      const nav = container.querySelector("nav.lg\\:hidden");
      expect(nav).toBeInTheDocument();
    });
  });
});
