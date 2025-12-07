import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/dashboard/EmptyState";

describe("EmptyState", () => {
  it('renders "No lists yet" message when filter is "all"', () => {
    const mockOnCreate = vi.fn();
    render(<EmptyState filter="all" onCreateClick={mockOnCreate} />);

    expect(screen.getByText("No lists yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first list to get started")
    ).toBeInTheDocument();
  });

  it('renders "No published lists yet" message when filter is "published"', () => {
    const mockOnCreate = vi.fn();
    render(<EmptyState filter="published" onCreateClick={mockOnCreate} />);

    expect(screen.getByText("No published lists yet")).toBeInTheDocument();
    expect(
      screen.getByText("Publish a list to see it here")
    ).toBeInTheDocument();
  });

  it('renders "No draft lists yet" message when filter is "drafts"', () => {
    const mockOnCreate = vi.fn();
    render(<EmptyState filter="drafts" onCreateClick={mockOnCreate} />);

    expect(screen.getByText("No draft lists yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create a draft to see it here")
    ).toBeInTheDocument();
  });

  it("calls onCreateClick callback when button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnCreate = vi.fn();
    render(<EmptyState filter="all" onCreateClick={mockOnCreate} />);

    const button = screen.getByRole("button", { name: /create new list/i });
    await user.click(button);

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it("renders Plus icon in button", () => {
    const mockOnCreate = vi.fn();
    render(<EmptyState filter="all" onCreateClick={mockOnCreate} />);

    const button = screen.getByRole("button", { name: /create new list/i });
    // Check if button contains the Plus icon's SVG
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
