import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

describe("DashboardContent", () => {
  it("renders children correctly", () => {
    render(
      <DashboardContent>
        <div>Test Content</div>
      </DashboardContent>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("uses main semantic element", () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
  });

  it("applies responsive margin class", () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector("main");
    expect(main).toHaveClass("lg:ml-64");
  });

  it("applies minimum height class", () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector("main");
    expect(main).toHaveClass("min-h-screen");
  });

  it("wraps children in padded container", () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const paddedDiv = container.querySelector(".p-6");
    expect(paddedDiv).toBeInTheDocument();
    expect(paddedDiv).toHaveTextContent("Test");
  });
});
