import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

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

/**
 * Component tests for DashboardPage
 *
 * Authentication protection is tested separately via:
 * - middleware.test.ts (middleware-level auth)
 * - layout.test.tsx (server-side auth in layout)
 * - auth-protection.test.ts (integration tests)
 *
 * These tests focus on component rendering and UI structure.
 */
describe("DashboardPage - Component Rendering", () => {
  it("renders dashboard header", () => {
    render(<DashboardPage />);
    expect(screen.getByText("My Lists")).toBeInTheDocument();
  });

  it("renders desktop sidebar", () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveClass("lg:block");
  });

  it("renders mobile navigation header", () => {
    const { container } = render(<DashboardPage />);
    const nav = container.querySelector("nav.lg\\:hidden");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("lg:hidden");
  });

  it("renders hamburger menu button", () => {
    render(<DashboardPage />);
    const menuButton = screen.getByLabelText("Open navigation menu");
    expect(menuButton).toBeInTheDocument();
  });

  it("uses semantic HTML structure", () => {
    const { container } = render(<DashboardPage />);

    // Check for semantic elements
    const aside = container.querySelector("aside");
    const nav = container.querySelector("nav");
    const main = container.querySelector("main");

    expect(aside).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });
});
