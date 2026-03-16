import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddPlaceDialog } from "@/app/(dashboard)/dashboard/lists/[listId]/_components/AddPlaceDialog";

// ─── Mock server actions ──────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  createPlaceAction: vi.fn(),
  addExistingPlaceToListAction: vi.fn(),
  searchPlacesAction: vi.fn().mockResolvedValue({
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
  }),
  resolveGooglePlacePhotoAction: vi.fn().mockResolvedValue({
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
  }),
}));

// ─── Control useActionState via React mock ────────────────────────────────────

const mockFormAction = vi.fn();
let mockIsCreatePending = false;

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: (_action: unknown, _initial: unknown) => [
      { data: null, error: null, fieldErrors: {}, isSuccess: false },
      mockFormAction,
      mockIsCreatePending,
    ],
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddPlaceDialog (list context)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCreatePending = false;
  });

  it("renders the trigger button", () => {
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    expect(screen.getByRole("button", { name: /add a place/i })).toBeTruthy();
  });

  it("opens the dialog with the create form after clicking trigger", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await user.click(screen.getByRole("button", { name: /add a place/i }));
    expect(screen.getByLabelText(/search for a place/i)).toBeTruthy();
  });

  it("shows create button disabled initially (no place selected)", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await user.click(screen.getByRole("button", { name: /add a place/i }));
    expect(
      screen.getByRole("button", { name: /create place/i })
    ).toBeDisabled();
  });
});
