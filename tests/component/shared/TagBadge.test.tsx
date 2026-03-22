import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagBadge, TagBadgeList } from "@/components/shared/TagBadge";

describe("TagBadge", () => {
  it("renders the tag name", () => {
    render(<TagBadge name="cafe" />);
    expect(screen.getByText("cafe")).toBeInTheDocument();
  });

  it("renders remove button when onRemove is provided", () => {
    const onRemove = vi.fn();
    render(<TagBadge name="cafe" onRemove={onRemove} />);
    expect(screen.getByLabelText("Remove tag cafe")).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is not provided", () => {
    render(<TagBadge name="cafe" />);
    expect(screen.queryByLabelText("Remove tag cafe")).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<TagBadge name="cafe" onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remove tag cafe"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("stops propagation on remove click", () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    render(<TagBadge name="cafe" onClick={onClick} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remove tag cafe"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("TagBadgeList", () => {
  it("renders nothing when tags array is empty", () => {
    const { container } = render(<TagBadgeList tags={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders all tags when no maxVisible", () => {
    const tags = [
      { name: "cafe", source: "system" as const },
      { name: "bar", source: "system" as const },
      { name: "vegan", source: "custom" as const },
    ];
    render(<TagBadgeList tags={tags} />);
    expect(screen.getByText("cafe")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
    expect(screen.getByText("vegan")).toBeInTheDocument();
  });

  it("truncates tags and shows overflow badge when maxVisible is set", () => {
    const tags = [
      { name: "cafe", source: "system" as const },
      { name: "bar", source: "system" as const },
      { name: "vegan", source: "custom" as const },
    ];
    render(<TagBadgeList tags={tags} maxVisible={2} />);
    expect(screen.getByText("cafe")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
    expect(screen.queryByText("vegan")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("does not show overflow badge when all tags fit", () => {
    const tags = [
      { name: "cafe", source: "system" as const },
      { name: "bar", source: "system" as const },
    ];
    render(<TagBadgeList tags={tags} maxVisible={3} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
