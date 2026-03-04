import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddPlaceDialog } from "@/app/(dashboard)/dashboard/lists/[listId]/_components/AddPlaceDialog";

// ─── Mock server actions ──────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  createPlaceAction: vi.fn(),
  addExistingPlaceToListAction: vi.fn(),
}));

// ─── Control useActionState via React mock ────────────────────────────────────

type ActionState = {
  data: null;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isSuccess: boolean;
};

const idleState: ActionState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};

let mockIsCreatePending = false;
const mockFormAction = vi.fn();

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: (_action: unknown, _initial: unknown) => [
      idleState,
      mockFormAction,
      mockIsCreatePending,
    ],
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: /add a place/i });
  await user.click(trigger);
}

function getCreateButton() {
  return screen.getByRole("button", { name: /create place/i });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddPlaceDialog — create form controlled inputs (FR-012)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCreatePending = false;
  });

  it("submit button is disabled when both fields are empty", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    expect(getCreateButton()).toBeDisabled();
  });

  it("submit button is disabled when name has content but address is empty", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/name/i), "The Coffee House");
    expect(getCreateButton()).toBeDisabled();
  });

  it("submit button is disabled when address has content but name is empty", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/address/i), "1 Main St, London");
    expect(getCreateButton()).toBeDisabled();
  });

  it("submit button is disabled when name is whitespace-only", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/name/i), "   ");
    await user.type(screen.getByLabelText(/address/i), "1 Main St, London");
    expect(getCreateButton()).toBeDisabled();
  });

  it("submit button is disabled when address is whitespace-only", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/name/i), "The Coffee House");
    await user.type(screen.getByLabelText(/address/i), "   ");
    expect(getCreateButton()).toBeDisabled();
  });

  it("submit button is enabled when both fields have valid content", async () => {
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/name/i), "The Coffee House");
    await user.type(screen.getByLabelText(/address/i), "1 Main St, London");
    expect(getCreateButton()).not.toBeDisabled();
  });

  it("submit button is disabled while pending even with valid content", async () => {
    mockIsCreatePending = true;
    const user = userEvent.setup();
    render(<AddPlaceDialog listId="list-1" availablePlaces={[]} />);
    await openDialog(user);

    await user.type(screen.getByLabelText(/name/i), "The Coffee House");
    await user.type(screen.getByLabelText(/address/i), "1 Main St, London");
    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
  });
});
