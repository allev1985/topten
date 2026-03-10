import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateListForm } from "@/components/dashboard/CreateListForm";

// ─── Mock server action ───────────────────────────────────────────────────────

vi.mock("@/actions/list-actions", () => ({
  createListAction: vi.fn(),
}));

// ─── Control useActionState via React mock ────────────────────────────────────

type ActionState = {
  data: null | { listId: string; slug: string };
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isSuccess: boolean;
};

let mockActionState: ActionState = {
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
      mockActionState,
      mockFormAction,
      mockIsPending,
    ],
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CreateListForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActionState = {
      data: null,
      error: null,
      fieldErrors: {},
      isSuccess: false,
    };
    mockIsPending = false;
  });

  it("renders in idle state with submit button disabled when title is empty", () => {
    render(<CreateListForm />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /create list/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("enables submit button when title is non-empty", () => {
    render(<CreateListForm />);

    const input = screen.getByLabelText(/title/i);
    fireEvent.change(input, { target: { value: "My favourite cafés" } });

    const btn = screen.getByRole("button", { name: /create list/i });
    expect(btn).not.toBeDisabled();
  });

  it("disables submit button while pending", () => {
    mockIsPending = true;
    render(<CreateListForm />);

    const btn = screen.getByRole("button", { name: /creating/i });
    expect(btn).toBeDisabled();
  });

  it("shows form-level error alert when state.error is set", () => {
    mockActionState.error = "Failed to create list. Please try again.";
    render(<CreateListForm />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Failed to create list. Please try again.");
  });

  it("shows title field error when state.fieldErrors.title is set", () => {
    mockActionState.fieldErrors = { title: ["Title is required"] };
    render(<CreateListForm />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Title is required");
  });

  it("calls onSuccess when state.isSuccess becomes true", () => {
    mockActionState.isSuccess = true;
    const onSuccess = vi.fn();
    render(<CreateListForm onSuccess={onSuccess} />);

    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
