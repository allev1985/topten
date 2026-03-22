import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagInput } from "@/components/shared/TagInput";

// Mock the searchTagsAction
vi.mock("@/actions/tag-actions", () => ({
  searchTagsAction: vi.fn().mockResolvedValue({
    isSuccess: true,
    data: {
      tags: [
        { id: "1", name: "cafe", source: "system" },
        { id: "2", name: "cafeteria", source: "custom" },
      ],
    },
    error: null,
    fieldErrors: {},
  }),
}));

describe("TagInput", () => {
  const defaultProps = {
    value: [] as string[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with placeholder when no tags selected", () => {
    render(<TagInput {...defaultProps} placeholder="Add tags…" />);
    expect(screen.getByPlaceholderText("Add tags…")).toBeInTheDocument();
  });

  it("renders existing tags as badges", () => {
    render(<TagInput {...defaultProps} value={["cafe", "bar"]} />);
    expect(screen.getByText("cafe")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
  });

  it("removes placeholder when tags exist", () => {
    render(
      <TagInput {...defaultProps} value={["cafe"]} placeholder="Add tags…" />
    );
    expect(screen.queryByPlaceholderText("Add tags…")).not.toBeInTheDocument();
  });

  it("calls onChange when Enter is pressed with a valid tag name", () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "cafe" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["cafe"]);
  });

  it("calls onChange when comma is pressed", () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "cafe" } });
    fireEvent.keyDown(input, { key: "," });

    expect(onChange).toHaveBeenCalledWith(["cafe"]);
  });

  it("does not add duplicate tags", () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} value={["cafe"]} onChange={onChange} />);

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "cafe" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("normalises tag name on add (lowercase, hyphens)", () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "Hair Care" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["hair-care"]);
  });

  it("removes last tag on Backspace when input is empty", () => {
    const onChange = vi.fn();
    render(
      <TagInput {...defaultProps} value={["cafe", "bar"]} onChange={onChange} />
    );

    const input = screen.getByLabelText("Add tag");
    fireEvent.keyDown(input, { key: "Backspace" });

    expect(onChange).toHaveBeenCalledWith(["cafe"]);
  });

  it("does not add tag shorter than 2 characters", () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects maxTags limit", () => {
    const onChange = vi.fn();
    render(
      <TagInput
        {...defaultProps}
        value={["t1", "t2"]}
        onChange={onChange}
        maxTags={2}
      />
    );

    const input = screen.getByLabelText("Add tag");
    fireEvent.change(input, { target: { value: "cafe" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders remove button on each tag badge", () => {
    render(<TagInput {...defaultProps} value={["cafe", "bar"]} />);
    expect(screen.getByLabelText("Remove tag cafe")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove tag bar")).toBeInTheDocument();
  });

  it("calls onChange without the removed tag when remove is clicked", () => {
    const onChange = vi.fn();
    render(
      <TagInput {...defaultProps} value={["cafe", "bar"]} onChange={onChange} />
    );

    fireEvent.click(screen.getByLabelText("Remove tag cafe"));
    expect(onChange).toHaveBeenCalledWith(["bar"]);
  });

  it("accepts a custom id prop", () => {
    render(<TagInput {...defaultProps} id="my-tags" />);
    expect(screen.getByLabelText("Add tag")).toHaveAttribute("id", "my-tags");
  });
});
