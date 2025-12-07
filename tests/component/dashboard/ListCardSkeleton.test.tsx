import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ListCardSkeleton } from "@/components/dashboard/ListCardSkeleton";

describe("ListCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<ListCardSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it("renders skeleton elements with animation", () => {
    const { container } = render(<ListCardSkeleton />);

    // Check for skeleton elements with animate-pulse class
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("matches ListCard structure with aspect-[16/9] hero image skeleton", () => {
    const { container } = render(<ListCardSkeleton />);

    // Check for 16:9 aspect ratio hero image skeleton
    const heroSkeleton = container.querySelector(".aspect-\\[16\\/9\\]");
    expect(heroSkeleton).toBeInTheDocument();
  });
});
