import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock signOutAction
vi.mock("@/actions/auth-actions", () => ({
  signOutAction: vi.fn(() => Promise.resolve()),
}));

describe("DashboardSidebar", () => {
  it("renders YourFavs branding", () => {
    render(<DashboardSidebar />);
    expect(screen.getByText(/YourFavs/i)).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(<DashboardSidebar />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "flex-col", "h-full");
  });

  describe("User Story 1: Navigate Between List Views", () => {
    it("should render all navigation items (All Lists, Published, Drafts)", () => {
      render(<DashboardSidebar />);

      expect(screen.getByText("All Lists")).toBeInTheDocument();
      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });

    it("should highlight active filter based on URL search params", async () => {
      const { useSearchParams } = await import("next/navigation");
      const mockGet = vi.fn((key: string) =>
        key === "filter" ? "published" : null
      );
      (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
        get: mockGet,
      });

      render(<DashboardSidebar />);

      const publishedLink = screen.getByText("Published").closest("a");
      expect(publishedLink).toHaveAttribute("data-active", "true");

      const allListsLink = screen.getByText("All Lists").closest("a");
      expect(allListsLink).toHaveAttribute("data-active", "false");

      const draftsLink = screen.getByText("Drafts").closest("a");
      expect(draftsLink).toHaveAttribute("data-active", "false");
    });

    it("should have correct href with filter parameter for each navigation item", () => {
      render(<DashboardSidebar />);

      const allListsLink = screen.getByText("All Lists").closest("a");
      expect(allListsLink).toHaveAttribute("href", "/dashboard");

      const publishedLink = screen.getByText("Published").closest("a");
      expect(publishedLink).toHaveAttribute(
        "href",
        "/dashboard?filter=published"
      );

      const draftsLink = screen.getByText("Drafts").closest("a");
      expect(draftsLink).toHaveAttribute("href", "/dashboard?filter=drafts");
    });
  });

  describe("User Story 2: Expand/Collapse Lists Section", () => {
    it("Lists section is expanded by default on page load", () => {
      render(<DashboardSidebar />);

      // Navigation items should be visible
      expect(screen.getByText("All Lists")).toBeInTheDocument();
      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });

    it("clicking Lists header collapses the section", async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar />);

      // Find the Lists header button (containing "Lists" text but not the navigation links)
      const listsHeader = screen.getAllByText("Lists")[0].closest("button");
      expect(listsHeader).toBeInTheDocument();

      // Click the header to collapse
      await user.click(listsHeader!);

      // Navigation items should not be visible
      expect(screen.queryByText("All Lists")).not.toBeInTheDocument();
      expect(screen.queryByText("Published")).not.toBeInTheDocument();
      expect(screen.queryByText("Drafts")).not.toBeInTheDocument();
    });

    it("clicking collapsed Lists header expands the section", async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar />);

      const listsHeader = screen.getAllByText("Lists")[0].closest("button");

      // Collapse first
      await user.click(listsHeader!);
      expect(screen.queryByText("All Lists")).not.toBeInTheDocument();

      // Expand again
      await user.click(listsHeader!);
      expect(screen.getByText("All Lists")).toBeInTheDocument();
      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });
  });

  describe("User Story 3: Sign Out from Dashboard", () => {
    it("Sign Out button renders in sidebar", () => {
      render(<DashboardSidebar />);

      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("clicking Sign Out calls signOutAction", async () => {
      const user = userEvent.setup();
      const { signOutAction } = await import("@/actions/auth-actions");

      render(<DashboardSidebar />);

      const signOutButton = screen.getByText("Sign Out");
      await user.click(signOutButton);

      expect(signOutAction).toHaveBeenCalled();
    });

    it("Sign Out shows loading state during sign-out", async () => {
      const user = userEvent.setup();
      const { signOutAction } = await import("@/actions/auth-actions");

      // Make signOut take some time
      (signOutAction as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(<DashboardSidebar />);

      const signOutButton = screen.getByText("Sign Out");
      await user.click(signOutButton);

      // Should show loading state
      expect(screen.getByText("Signing out...")).toBeInTheDocument();
    });

    it("Sign Out handles errors gracefully", async () => {
      const user = userEvent.setup();
      const { signOutAction } = await import("@/actions/auth-actions");

      // Make signOut reject
      (signOutAction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error")
      );

      render(<DashboardSidebar />);

      const signOutButton = screen.getByText("Sign Out");
      await user.click(signOutButton);

      // Should return to normal state after error
      await vi.waitFor(() => {
        expect(screen.getByText("Sign Out")).toBeInTheDocument();
      });
    });
  });
});
