import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlugSettingsForm } from "@/app/(dashboard)/dashboard/settings/_components/SlugSettingsForm";

// No server action or hook needed — component is display-only
vi.mock("@/actions/profile-actions", () => ({
  updateSlugAction: vi.fn(),
}));

describe("SlugSettingsForm", () => {
  const DEFAULT_SLUG = "john-doe";

  describe("Display — Profile URL is read-only", () => {
    it("renders the Profile URL card heading", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(screen.getByText("Profile URL")).toBeInTheDocument();
    });

    it("renders the vanitySlug input with the initial slug", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      const input = screen.getByRole("textbox", { name: /profile url/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(DEFAULT_SLUG);
    });

    it("input is disabled and read-only", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      const input = screen.getByRole("textbox", { name: /profile url/i });
      expect(input).toBeDisabled();
    });

    it("shows the current slug in the URL preview hint", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(screen.getByText(`/${DEFAULT_SLUG}`)).toBeInTheDocument();
    });

    it("renders a disabled 'Cannot change' button", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      const button = screen.getByRole("button", { name: /cannot change/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("shows support contact message in the card footer", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(
        screen.getByText(/contact support to change your profile url/i)
      ).toBeInTheDocument();
    });

    it("input value reflects initialSlug prop", () => {
      render(<SlugSettingsForm initialSlug="my-custom-slug" />);

      const input = screen.getByRole("textbox", { name: /profile url/i });
      expect(input).toHaveValue("my-custom-slug");
    });
  });
});
