import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

describe("Responsive Layout Integration", () => {
  it("applies desktop sidebar classes", () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden", "lg:block");
    expect(aside).toHaveClass("fixed", "left-0", "top-0");
    expect(aside).toHaveClass("h-screen", "w-64");
  });

  it("applies mobile nav classes", () => {
    const { container } = render(<DashboardPage />);
    // Select the mobile header nav (not the nav inside sidebar)
    const nav = container.querySelector("nav.lg\\:hidden");
    expect(nav).toHaveClass("lg:hidden");
    expect(nav).toHaveClass("fixed", "top-0");
  });

  it("applies responsive content margin", () => {
    const { container } = render(<DashboardPage />);
    const main = container.querySelector("main");
    expect(main).toHaveClass("lg:ml-64");
  });

  it("sidebar has correct width", () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-64");
  });

  it("mobile header has z-index for layering", () => {
    const { container } = render(<DashboardPage />);
    const nav = container.querySelector("nav.lg\\:hidden");
    expect(nav).toHaveClass("z-50");
  });

  it("applies mobile content offset", () => {
    const { container } = render(<DashboardPage />);
    const contentWrapper = container.querySelector(".mt-16");
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveClass("lg:mt-0");
  });
});
