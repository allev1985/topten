import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/dashboard/ErrorState";

describe("ErrorState", () => {
  it('renders error title "Failed to load lists"', () => {
    const mockError = new Error("Test error message");
    const mockRetry = vi.fn();

    render(<ErrorState error={mockError} onRetry={mockRetry} />);

    expect(screen.getByText("Failed to load lists")).toBeInTheDocument();
  });

  it("renders error description text", () => {
    const mockError = new Error("Network connection failed");
    const mockRetry = vi.fn();

    render(<ErrorState error={mockError} onRetry={mockRetry} />);

    expect(screen.getByText("Network connection failed")).toBeInTheDocument();
  });

  it("renders Retry button", () => {
    const mockError = new Error("Test error");
    const mockRetry = vi.fn();

    render(<ErrorState error={mockError} onRetry={mockRetry} />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("calls onRetry callback when button is clicked", async () => {
    const user = userEvent.setup();
    const mockError = new Error("Test error");
    const mockRetry = vi.fn();

    render(<ErrorState error={mockError} onRetry={mockRetry} />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await user.click(retryButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
