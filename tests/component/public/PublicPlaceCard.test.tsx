import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicPlaceCard } from "@/components/public/PublicPlaceCard";
import type { PublicPlaceEntry } from "@/lib/public/types";

// Mock next/image to avoid Next.js Image optimisation in jsdom
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...rest} />,
}));

describe("PublicPlaceCard", () => {
  const basePlace: PublicPlaceEntry = {
    id: "place-1",
    name: "The Coffee House",
    address: "1 Main Street, London",
    description: null,
    heroImageUrl: null,
    position: 1,
    tags: [],
  };

  it("renders the place name", () => {
    render(<PublicPlaceCard place={basePlace} rank={1} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "The Coffee House" })
    ).toBeInTheDocument();
  });

  it("renders the place address", () => {
    render(<PublicPlaceCard place={basePlace} rank={1} />);
    expect(screen.getByText("1 Main Street, London")).toBeInTheDocument();
  });

  it("renders the rank number", () => {
    render(<PublicPlaceCard place={basePlace} rank={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders rank 1 correctly", () => {
    render(<PublicPlaceCard place={basePlace} rank={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <PublicPlaceCard
        place={{ ...basePlace, description: "Great espresso" }}
        rank={1}
      />
    );
    expect(screen.getByText("Great espresso")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    render(<PublicPlaceCard place={basePlace} rank={1} />);
    expect(screen.queryByText(/great espresso/i)).not.toBeInTheDocument();
  });

  it("renders hero image when heroImageUrl is provided", () => {
    render(
      <PublicPlaceCard
        place={{
          ...basePlace,
          heroImageUrl: "https://example.com/photo.jpg",
        }}
        rank={1}
      />
    );
    const img = screen.getByRole("img", {
      name: "Photo of The Coffee House",
    });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("does not render an image when heroImageUrl is null", () => {
    render(<PublicPlaceCard place={basePlace} rank={1} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
