import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeletePlaceDialog } from "@/app/(dashboard)/dashboard/places/_components/DeletePlaceDialog";
import type { PlaceWithListCount } from "@/lib/place/service";

// ─── Mock server action ───────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  deletePlaceGlobalAction: vi.fn(),
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

const makePlace = (override: Partial<PlaceWithListCount> = {}): PlaceWithListCount => ({
  id: "place-1",
  name: "The Coffee House",
  address: "1 Main St",
  description: null,
  activeListCount: 0,
  ...override,
});

function renderDialog(place: PlaceWithListCount = makePlace()) {
  const onOpenChange = vi.fn();
  render(
    <DeletePlaceDialog place={place} open={true} onOpenChange={onOpenChange} />
  );
  return { onOpenChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DeletePlaceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
    mockIsPending = false;
  });

  it("shows the place name in the dialog", () => {
    renderDialog();
    expect(screen.getByText(/The Coffee House/)).toBeTruthy();
  });

  it("does not mention list cascade when place is in 0 lists", () => {
    renderDialog(makePlace({ activeListCount: 0 }));
    expect(screen.queryByText(/list/)).toBeFalsy();
  });

  it("mentions list count cascade when place is in 1 list", () => {
    renderDialog(makePlace({ activeListCount: 1 }));
    expect(screen.getByText(/1 list/)).toBeTruthy();
  });

  it("mentions list count cascade when place is in multiple lists", () => {
    renderDialog(makePlace({ activeListCount: 3 }));
    expect(screen.getByText(/3 lists/)).toBeTruthy();
  });

  it("Delete button is enabled in idle state", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /delete place/i })).not.toBeDisabled();
  });

  it("Delete button is disabled while pending", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
  });

  it("shows error message from action state", () => {
    mockState = { data: null, error: "Something went wrong", fieldErrors: {}, isSuccess: false };
    renderDialog();
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("Cancel button closes the dialog", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cancel button is disabled while pending", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("hidden placeId input is present with correct value", () => {
    renderDialog(makePlace({ id: "place-abc" }));
    const input = document.querySelector<HTMLInputElement>("input[name='placeId']");
    expect(input?.value).toBe("place-abc");
  });
});
