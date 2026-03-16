import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileHeader } from "@/components/public/ProfileHeader";

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

describe("ProfileHeader", () => {
  const baseProps = {
    name: "Alice Smith",
    bio: null,
    avatarUrl: null,
    vanitySlug: "alice",
  };

  it("renders the user's display name", () => {
    render(<ProfileHeader {...baseProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Alice Smith" })
    ).toBeInTheDocument();
  });

  it("renders the vanity slug", () => {
    render(<ProfileHeader {...baseProps} />);
    expect(screen.getByText("@alice")).toBeInTheDocument();
  });

  it("renders bio when provided", () => {
    render(<ProfileHeader {...baseProps} bio="Coffee lover and bookworm" />);
    expect(screen.getByText("Coffee lover and bookworm")).toBeInTheDocument();
  });

  it("does not render bio element when bio is null", () => {
    render(<ProfileHeader {...baseProps} bio={null} />);
    expect(screen.queryByText(/coffee/i)).not.toBeInTheDocument();
  });

  it("renders the avatar image when avatarUrl is provided", () => {
    render(
      <ProfileHeader
        {...baseProps}
        avatarUrl="https://example.com/avatar.jpg"
      />
    );
    const img = screen.getByRole("img", { name: "Alice Smith's avatar" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders initials fallback when avatarUrl is null", () => {
    render(<ProfileHeader {...baseProps} avatarUrl={null} />);
    // Initials are "AS" for "Alice Smith"
    expect(screen.getByText("AS")).toBeInTheDocument();
    // No img element in the fallback path
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders single initial for single-word name", () => {
    render(<ProfileHeader {...baseProps} name="Alice" avatarUrl={null} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
