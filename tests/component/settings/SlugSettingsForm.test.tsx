import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlugSettingsForm } from "@/app/(dashboard)/settings/_components/SlugSettingsForm";

// Mock the server action — the component imports it but the hook controls behaviour
vi.mock("@/actions/profile-actions", () => ({
  updateSlugAction: vi.fn(),
}));

// Track the mock formAction bound by the hook
let capturedFormAction: (formData: FormData) => void = vi.fn();

// Control what state the hook exposes for each test
let mockState = {
  data: null as { vanitySlug: string } | null,
  error: null as string | null,
  fieldErrors: {} as Record<string, string[]>,
  isSuccess: false,
  isPending: false,
};

vi.mock("@/hooks/use-form-state", () => ({
  useFormState: (_action: unknown) => ({
    state: mockState,
    formAction: capturedFormAction,
    reset: vi.fn(),
  }),
}));

describe("SlugSettingsForm", () => {
  const DEFAULT_SLUG = "john-doe";

  beforeEach(() => {
    vi.clearAllMocks();
    capturedFormAction = vi.fn();
    mockState = {
      data: null,
      error: null,
      fieldErrors: {},
      isSuccess: false,
      isPending: false,
    };
  });

  describe("User Story 1 — Update Vanity Slug", () => {
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

    it("shows the current slug in the URL preview hint", () => {
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(screen.getByText(`/${DEFAULT_SLUG}`)).toBeInTheDocument();
    });

    it("shows inline field error when vanitySlug fieldError is present", () => {
      mockState.fieldErrors = {
        vanitySlug: ["This URL is already taken. Please choose a different one."],
      };

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(
        screen.getByText(
          "This URL is already taken. Please choose a different one."
        )
      ).toBeInTheDocument();
    });

    it("field error element has role=alert", () => {
      mockState.fieldErrors = {
        vanitySlug: ["URL can only contain lowercase letters, numbers, and hyphens"],
      };

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(
        screen.getByRole("alert", {
          name: /url can only contain/i,
        })
      ).toBeInTheDocument();
    });

    it("shows top-level error alert when state.error is set", () => {
      mockState.error = "Failed to update profile URL. Please try again.";

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(
        screen.getByText("Failed to update profile URL. Please try again.")
      ).toBeInTheDocument();
    });

    it("shows success message when state.isSuccess is true", () => {
      mockState.isSuccess = true;
      mockState.data = { vanitySlug: "new-slug" };

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(
        screen.getByRole("status", { name: /profile url updated successfully/i })
      ).toBeInTheDocument();
    });

    it("shows updated slug in URL preview after success", () => {
      mockState.isSuccess = true;
      mockState.data = { vanitySlug: "new-slug" };

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      expect(screen.getByText("/new-slug")).toBeInTheDocument();
    });

    it("form submission calls the bound formAction", async () => {
      const user = userEvent.setup();
      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      const button = screen.getByRole("button", { name: /save profile url/i });
      await user.click(button);

      expect(capturedFormAction).toHaveBeenCalled();
    });

    it("disables submit button while isPending is true", () => {
      mockState.isPending = true;

      render(<SlugSettingsForm initialSlug={DEFAULT_SLUG} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/saving/i);
    });
  });
});
