import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

describe("DashboardSidebar", () => {
  it("renders YourFavs branding", () => {
    render(<DashboardSidebar />);
    expect(screen.getByText(/YourFavs/i)).toBeInTheDocument();
  });

  it("includes navigation container", () => {
    const { container } = render(<DashboardSidebar />);
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("displays placeholder text for future navigation", () => {
    render(<DashboardSidebar />);
    expect(
      screen.getByText(/Navigation items coming soon/i)
    ).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(<DashboardSidebar />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "flex-col", "h-full");
  });

  it("has bordered branding section", () => {
    const { container } = render(<DashboardSidebar />);
    const brandingSection = container.querySelector(".border-b");
    expect(brandingSection).toBeInTheDocument();
    expect(brandingSection).toHaveTextContent("YourFavs");
  });
});
