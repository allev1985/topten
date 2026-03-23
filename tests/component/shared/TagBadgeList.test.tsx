import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagBadgeList } from "@/components/shared/TagBadgeList";

describe("TagBadgeList", () => {
  const tags = [
    { id: "t1", label: "Cafe", isSystem: true },
    { id: "t2", label: "Hidden Gem", isSystem: false },
  ];

  it("renders nothing when tags is empty", () => {
    const { container } = render(<TagBadgeList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a badge for each tag", () => {
    render(<TagBadgeList tags={tags} />);
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByText("Hidden Gem")).toBeInTheDocument();
  });

  it("applies the provided className to the wrapper", () => {
    const { container } = render(<TagBadgeList tags={tags} className="mt-4" />);
    expect(container.firstChild).toHaveClass("mt-4");
  });

  it("applies small sizing when size='sm'", () => {
    render(<TagBadgeList tags={[tags[0]!]} size="sm" />);
    const badge = screen.getByText("Cafe");
    expect(badge).toHaveClass("px-2");
  });
});
