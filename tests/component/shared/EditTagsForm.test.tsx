import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Mock tag actions ─────────────────────────────────────────────────────────

const { mockSetPlaceTagsAction, mockSearchTagsAction } = vi.hoisted(() => ({
  mockSetPlaceTagsAction: vi.fn(),
  mockSearchTagsAction: vi.fn(),
}));
vi.mock("@/actions/tag-actions", () => ({
  setPlaceTagsAction: mockSetPlaceTagsAction,
  searchTagsAction: mockSearchTagsAction,
}));

// ─── Control useActionState via React mock ────────────────────────────────────

type ActionState = {
  data: { tags: unknown[] } | null;
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
let capturedAction: unknown;

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: (action: unknown, _initial: unknown) => {
      capturedAction = action;
      return [mockState, mockFormAction, mockIsPending];
    },
  };
});

// ─── Import after mocks ───────────────────────────────────────────────────────

import { EditTagsForm } from "@/components/shared/EditTagsForm";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EditTagsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
    mockIsPending = false;
    capturedAction = undefined;
    mockSearchTagsAction.mockResolvedValue({
      data: { results: [] },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
  });

  it("renders the entityId in a hidden field", () => {
    const { container } = render(
      <EditTagsForm entityId="place-1" initialTags={[]} />
    );
    const hidden = container.querySelector<HTMLInputElement>(
      'input[name="entityId"]'
    );
    expect(hidden?.value).toBe("place-1");
  });

  it("pre-populates TagInput with initialTags", () => {
    render(<EditTagsForm entityId="place-1" initialTags={["Cafe", "Bar"]} />);
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByText("Bar")).toBeInTheDocument();
  });

  it("always wires to setPlaceTagsAction", () => {
    render(<EditTagsForm entityId="place-1" initialTags={[]} />);
    expect(capturedAction).toBe(mockSetPlaceTagsAction);
  });

  it("shows an error alert when the action returns an error", () => {
    mockState = {
      data: null,
      error: "Tag save failed",
      fieldErrors: {},
      isSuccess: false,
    };
    render(<EditTagsForm entityId="place-1" initialTags={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Tag save failed");
  });

  it("passes field errors through to TagInput", () => {
    mockState = {
      data: null,
      error: null,
      fieldErrors: { tags: ["Too many tags"] },
      isSuccess: false,
    };
    render(<EditTagsForm entityId="place-1" initialTags={[]} />);
    expect(screen.getByText("Too many tags")).toBeInTheDocument();
  });

  it("disables the submit button and shows saving state while pending", () => {
    mockIsPending = true;
    render(<EditTagsForm entityId="place-1" initialTags={[]} />);
    const btn = screen.getByRole("button", { name: /saving/i });
    expect(btn).toBeDisabled();
  });

  it("calls onSuccess when the action succeeds", () => {
    mockState = {
      data: { tags: [] },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
    const onSuccess = vi.fn();
    render(
      <EditTagsForm entityId="place-1" initialTags={[]} onSuccess={onSuccess} />
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does not call onSuccess when the action has not succeeded", () => {
    const onSuccess = vi.fn();
    render(
      <EditTagsForm entityId="place-1" initialTags={[]} onSuccess={onSuccess} />
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
