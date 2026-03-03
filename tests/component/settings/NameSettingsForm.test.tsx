import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NameSettingsForm } from "@/app/(dashboard)/dashboard/settings/_components/NameSettingsForm";

// Mock the server action — the component imports it but the hook controls behaviour
vi.mock("@/actions/profile-actions", () => ({
  updateNameAction: vi.fn(),
}));

// Track the mock formAction bound by the hook
let capturedFormAction: (formData: FormData) => void = vi.fn();

// Control what state the hook exposes for each test
let mockState = {
  data: null as { name: string } | null,
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

describe("NameSettingsForm", () => {
  const DEFAULT_NAME = "Alice Smith";

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

  describe("User Story 2 — Update Display Name", () => {
    it("renders the Profile card heading", () => {
      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("renders the name input pre-populated with the initial name", () => {
      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      const input = screen.getByRole("textbox", { name: /name/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(DEFAULT_NAME);
    });

    it("shows inline field error when name fieldError is present", () => {
      mockState.fieldErrors = { name: ["Name is required"] };

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    it("field error element has role=alert", () => {
      mockState.fieldErrors = { name: ["Name is too long"] };

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      expect(
        screen.getByRole("alert", { name: /name is too long/i })
      ).toBeInTheDocument();
    });

    it("shows top-level error alert when state.error is set", () => {
      mockState.error = "Failed to update name. Please try again.";

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      expect(
        screen.getByText("Failed to update name. Please try again.")
      ).toBeInTheDocument();
    });

    it("shows success message when state.isSuccess is true", () => {
      mockState.isSuccess = true;
      mockState.data = { name: "Bob Jones" };

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      expect(
        screen.getByRole("status", { name: /name updated successfully/i })
      ).toBeInTheDocument();
    });

    it("reflects saved name in input after success", () => {
      mockState.isSuccess = true;
      mockState.data = { name: "Bob Jones" };

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      const input = screen.getByRole("textbox", { name: /name/i });
      expect(input).toHaveValue("Bob Jones");
    });

    it("form submission calls the bound formAction", async () => {
      const user = userEvent.setup();
      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      const button = screen.getByRole("button", { name: /save name/i });
      await user.click(button);

      expect(capturedFormAction).toHaveBeenCalled();
    });

    it("disables submit button while isPending is true", () => {
      mockState.isPending = true;

      render(<NameSettingsForm initialName={DEFAULT_NAME} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/saving/i);
    });
  });
});
