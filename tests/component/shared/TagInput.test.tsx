import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mock server action ───────────────────────────────────────────────────────

const { mockSearchTagsAction } = vi.hoisted(() => ({
  mockSearchTagsAction: vi.fn(),
}));
vi.mock("@/actions/tag-actions", () => ({
  searchTagsAction: mockSearchTagsAction,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { TagInput } from "@/components/shared/TagInput";
import { config } from "@/lib/config/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hiddenValue(container: HTMLElement): string[] {
  const hidden = container.querySelector<HTMLInputElement>(
    'input[type="hidden"][name="tags"]'
  );
  return JSON.parse(hidden?.value ?? "[]") as string[];
}

function getTextbox(): HTMLInputElement {
  return screen.getByPlaceholderText(/add a tag/i) as HTMLInputElement;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TagInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchTagsAction.mockResolvedValue({
      data: { results: [] },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
  });

  // ── Initial render ─────────────────────────────────────────────────────────

  it("renders defaultValue as pills and serialises them into the hidden field", () => {
    const { container } = render(
      <TagInput name="tags" defaultValue={["Cafe", "Bar"]} />
    );
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByText("Bar")).toBeInTheDocument();
    expect(hiddenValue(container)).toEqual(["Cafe", "Bar"]);
  });

  it("shows the capacity counter", () => {
    render(<TagInput name="tags" defaultValue={["Cafe"]} />);
    expect(
      screen.getByText(`(1/${config.tags.maxPerEntity})`)
    ).toBeInTheDocument();
  });

  it("surfaces an error message when provided", () => {
    render(<TagInput name="tags" error="Too many tags" />);
    expect(screen.getByText("Too many tags")).toBeInTheDocument();
  });

  // ── Commit behaviour ───────────────────────────────────────────────────────

  it("commits free text on Enter and clears the input", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInput name="tags" />);

    await user.type(getTextbox(), "Hidden Gem{Enter}");

    expect(hiddenValue(container)).toEqual(["Hidden Gem"]);
    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input?.value).toBe("");
  });

  it("commits free text on comma", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInput name="tags" />);

    await user.type(getTextbox(), "Rooftop,");

    expect(hiddenValue(container)).toEqual(["Rooftop"]);
  });

  it("ignores duplicate labels (case-insensitive)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagInput name="tags" defaultValue={["Cafe"]} />
    );

    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]')!;
    await user.type(input, "CAFE{Enter}");

    expect(hiddenValue(container)).toEqual(["Cafe"]);
  });

  it("ignores empty / whitespace-only input", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInput name="tags" />);

    await user.type(getTextbox(), "   {Enter}");

    expect(hiddenValue(container)).toEqual([]);
  });

  // ── Removal ────────────────────────────────────────────────────────────────

  it("removes a tag via its X button", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagInput name="tags" defaultValue={["Cafe", "Bar"]} />
    );

    await user.click(screen.getByRole("button", { name: /remove cafe/i }));

    expect(hiddenValue(container)).toEqual(["Bar"]);
  });

  it("removes the trailing tag on Backspace when input is empty", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagInput name="tags" defaultValue={["Cafe", "Bar"]} />
    );

    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]')!;
    input.focus();
    await user.keyboard("{Backspace}");

    expect(hiddenValue(container)).toEqual(["Cafe"]);
  });

  // ── Capacity ───────────────────────────────────────────────────────────────

  it("hides the text input when at capacity", () => {
    const full = Array.from(
      { length: config.tags.maxPerEntity },
      (_, i) => `t${i}`
    );
    const { container } = render(<TagInput name="tags" defaultValue={full} />);

    expect(
      container.querySelector('input[type="text"]')
    ).not.toBeInTheDocument();
  });

  // ── Autocomplete ───────────────────────────────────────────────────────────

  it("debounces and queries searchTagsAction, then renders suggestions", async () => {
    mockSearchTagsAction.mockResolvedValue({
      data: {
        results: [{ id: "t1", slug: "cafe", label: "Cafe", isSystem: true }],
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
    const user = userEvent.setup();
    render(<TagInput name="tags" />);

    await user.type(getTextbox(), "caf");

    await waitFor(() =>
      expect(mockSearchTagsAction).toHaveBeenCalledWith("caf")
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cafe/i })).toBeInTheDocument()
    );
  });

  it("filters out already-selected suggestions", async () => {
    mockSearchTagsAction.mockResolvedValue({
      data: {
        results: [
          { id: "t1", slug: "cafe", label: "Cafe", isSystem: true },
          { id: "t2", slug: "bar", label: "Bar", isSystem: true },
        ],
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
    const user = userEvent.setup();
    const { container } = render(
      <TagInput name="tags" defaultValue={["Cafe"]} />
    );

    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]')!;
    await user.type(input, "a");

    await waitFor(() => expect(mockSearchTagsAction).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /bar/i })).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: /^cafe$/i })
    ).not.toBeInTheDocument();
  });

  it("clicking a suggestion commits it", async () => {
    mockSearchTagsAction.mockResolvedValue({
      data: {
        results: [{ id: "t1", slug: "cafe", label: "Cafe", isSystem: true }],
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
    const user = userEvent.setup();
    const { container } = render(<TagInput name="tags" />);

    await user.type(getTextbox(), "caf");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cafe/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: /cafe/i }));

    expect(hiddenValue(container)).toEqual(["Cafe"]);
  });

  it("ArrowDown + Enter commits the highlighted suggestion", async () => {
    mockSearchTagsAction.mockResolvedValue({
      data: {
        results: [
          { id: "t1", slug: "cafe", label: "Cafe", isSystem: true },
          { id: "t2", slug: "bar", label: "Bar", isSystem: true },
        ],
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
    const user = userEvent.setup();
    const { container } = render(<TagInput name="tags" />);

    await user.type(getTextbox(), "a");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cafe/i })).toBeInTheDocument()
    );
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{Enter}");

    expect(hiddenValue(container)).toEqual(["Cafe"]);
  });

  it("Escape closes the suggestion list", async () => {
    mockSearchTagsAction.mockResolvedValue({
      data: {
        results: [{ id: "t1", slug: "cafe", label: "Cafe", isSystem: true }],
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
    const user = userEvent.setup();
    render(<TagInput name="tags" />);

    await user.type(getTextbox(), "caf");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cafe/i })).toBeInTheDocument()
    );
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("button", { name: /cafe/i })
    ).not.toBeInTheDocument();
  });
});
