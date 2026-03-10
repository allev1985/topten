import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddPlaceDialog } from "@/app/(dashboard)/dashboard/places/_components/AddPlaceDialog";

// ─── Mock server action ───────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  createPlaceAction: vi.fn(),
}));

// ─── Control useActionState via React mock ────────────────────────────────────

type ActionState = {
  data: null;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isSuccess: boolean;
};

let mockState: ActionState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};
let mockIsPending = false;
const mockFormAction = vi.fn();

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: (_action: unknown, _initial: unknown) => [
      mockState,
      mockFormAction,
      mockIsPending,
    ],
  };
});

function renderDialog() {
  const onOpenChange = vi.fn();
  render(<AddPlaceDialog open={true} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddPlaceDialog (standalone)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
    mockIsPending = false;
  });

  it("renders the dialog title", () => {
    renderDialog();
    expect(screen.getByRole("heading", { name: /new place/i })).toBeTruthy();
  });

  it("submit button disabled when both fields are empty", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /add place/i })).toBeDisabled();
  });

  it("submit button disabled when only name is filled", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText(/name/i), "Cafe");
    expect(screen.getByRole("button", { name: /add place/i })).toBeDisabled();
  });

  it("submit button disabled when only address is filled", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText(/address/i), "1 Main St");
    expect(screen.getByRole("button", { name: /add place/i })).toBeDisabled();
  });

  it("submit button enabled when both fields have content", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText(/name/i), "Cafe");
    await user.type(screen.getByLabelText(/address/i), "1 Main St");
    expect(screen.getByRole("button", { name: /add place/i })).not.toBeDisabled();
  });

  it("submit button disabled while pending", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
  });

  it("shows field error for name", () => {
    mockState = {
      data: null,
      error: null,
      fieldErrors: { name: ["Name is required"] },
      isSuccess: false,
    };
    renderDialog();
    expect(screen.getByText("Name is required")).toBeTruthy();
  });

  it("shows form-level error", () => {
    mockState = {
      data: null,
      error: "Failed to create place",
      fieldErrors: {},
      isSuccess: false,
    };
    renderDialog();
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to create place");
  });

  it("Cancel closes the dialog", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cancel button disabled while pending", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
