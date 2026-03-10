import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditPlaceDialog } from "@/app/(dashboard)/dashboard/places/_components/EditPlaceDialog";
import type { PlaceWithListCount } from "@/lib/place/service";

// ─── Mock server action ───────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  updatePlaceAction: vi.fn(),
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

// ─── Test data ────────────────────────────────────────────────────────────────

const place: PlaceWithListCount = {
  id: "place-1",
  name: "The Coffee House",
  address: "1 Main St",
  activeListCount: 2,
};

function renderDialog(p: PlaceWithListCount = place) {
  const onOpenChange = vi.fn();
  render(<EditPlaceDialog place={p} open={true} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EditPlaceDialog (places page)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
    mockIsPending = false;
  });

  it("prefills name and address from the place prop", () => {
    renderDialog();
    expect(screen.getByLabelText<HTMLInputElement>(/name/i).value).toBe("The Coffee House");
    expect(screen.getByLabelText<HTMLInputElement>(/address/i).value).toBe("1 Main St");
  });

  it("Save button disabled when form is clean (no changes)", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save button enabled after changing name", async () => {
    const user = userEvent.setup();
    renderDialog();
    const nameInput = screen.getByLabelText<HTMLInputElement>(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  it("shows Unsaved changes badge when form is dirty", async () => {
    const user = userEvent.setup();
    renderDialog();
    const nameInput = screen.getByLabelText<HTMLInputElement>(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "x");
    expect(screen.getByText(/unsaved changes/i)).toBeTruthy();
  });

  it("Save button disabled while pending", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("Save button disabled when name is empty", async () => {
    const user = userEvent.setup();
    renderDialog();
    const nameInput = screen.getByLabelText<HTMLInputElement>(/name/i);
    await user.clear(nameInput);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows form-level error", () => {
    mockState = {
      data: null,
      error: "Not found",
      fieldErrors: {},
      isSuccess: false,
    };
    renderDialog();
    expect(screen.getByRole("alert")).toHaveTextContent("Not found");
  });

  it("hidden placeId input is present with no listId input", () => {
    renderDialog();
    const placeIdInput = document.querySelector<HTMLInputElement>("input[name='placeId']");
    const listIdInput = document.querySelector<HTMLInputElement>("input[name='listId']");
    expect(placeIdInput?.value).toBe("place-1");
    expect(listIdInput).toBeNull();
  });

  it("Cancel button closes the dialog", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
