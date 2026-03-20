import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicListCard } from "@/components/public/PublicListCard";
import type { PublicListSummary } from "@/lib/public/types";

// Mock next/link to render a plain anchor for testing
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("PublicListCard", () => {
  const baseList: PublicListSummary = {
    id: "list-1",
    title: "Top 10 Coffee Spots",
    slug: "a1b2",
    description: "The best coffee in town",
    updatedAt: new Date("2024-06-15T00:00:00Z"),
    placeCount: 7,
  };

  it("renders the list title", () => {
    render(<PublicListCard list={baseList} vanitySlug="alice" />);
    expect(screen.getByText("Top 10 Coffee Spots")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<PublicListCard list={baseList} vanitySlug="alice" />);
    expect(screen.getByText("The best coffee in town")).toBeInTheDocument();
  });

  it("does not render description element when description is null", () => {
    render(
      <PublicListCard
        list={{ ...baseList, description: null }}
        vanitySlug="alice"
      />
    );
    expect(
      screen.queryByText("The best coffee in town")
    ).not.toBeInTheDocument();
  });

  it("renders the correct href linking to the list", () => {
    render(<PublicListCard list={baseList} vanitySlug="alice" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@alice/lists/a1b2");
  });

  it("renders the place count", () => {
    render(<PublicListCard list={baseList} vanitySlug="alice" />);
    expect(screen.getByText("7 places")).toBeInTheDocument();
  });

  it("renders singular 'place' when placeCount is 1", () => {
    render(
      <PublicListCard
        list={{ ...baseList, placeCount: 1 }}
        vanitySlug="alice"
      />
    );
    expect(screen.getByText("1 place")).toBeInTheDocument();
  });

  it("renders the last updated date", () => {
    render(<PublicListCard list={baseList} vanitySlug="alice" />);
    expect(screen.getByText(/updated jun 15, 2024/i)).toBeInTheDocument();
  });
});
