import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { mockRequireAuth } = vi.hoisted(() => ({ mockRequireAuth: vi.fn() }));
vi.mock("@/lib/utils/actions", () => ({
  requireAuth: mockRequireAuth,
}));

const { mockSearchTags, mockSetListTags, mockSetPlaceTags } = vi.hoisted(
  () => ({
    mockSearchTags: vi.fn(),
    mockSetListTags: vi.fn(),
    mockSetPlaceTags: vi.fn(),
  })
);
vi.mock("@/lib/tag", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tag")>();
  return {
    ...actual,
    searchTags: mockSearchTags,
    setListTags: mockSetListTags,
    setPlaceTags: mockSetPlaceTags,
  };
});

vi.mock("@/lib/public", () => ({
  invalidatePublicListCaches: vi.fn().mockResolvedValue(undefined),
}));

// ─── Imports under test ───────────────────────────────────────────────────────

import {
  searchTagsAction,
  setListTagsAction,
  setPlaceTagsAction,
} from "@/actions/tag-actions";
import { TagServiceError } from "@/lib/tag";
import type { ActionState } from "@/types/forms";

const initial = { data: null, error: null, fieldErrors: {}, isSuccess: false };

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: "user-1", email: "a@b.c" });
});

// ─── searchTagsAction ─────────────────────────────────────────────────────────

describe("searchTagsAction", () => {
  it("returns unauthenticated error when session is absent", async () => {
    mockRequireAuth.mockResolvedValue({ error: "Not logged in" });
    const res = await searchTagsAction("cafe");
    expect(res.isSuccess).toBe(false);
    expect(res.error).toBe("Not logged in");
  });

  it("returns search results on success", async () => {
    mockSearchTags.mockResolvedValue([
      { id: "t1", slug: "cafe", label: "Cafe", isSystem: true },
    ]);
    const res = await searchTagsAction("cafe");
    expect(res.isSuccess).toBe(true);
    expect(res.data?.results).toHaveLength(1);
    expect(mockSearchTags).toHaveBeenCalledWith({
      query: "cafe",
      userId: "user-1",
    });
  });

  it("maps TagServiceError to a user-safe message", async () => {
    mockSearchTags.mockRejectedValue(
      new TagServiceError("SERVICE_ERROR", "DB down")
    );
    const res = await searchTagsAction("cafe");
    expect(res.isSuccess).toBe(false);
    expect(res.error).toBe("DB down");
  });

  it("uses a generic message for unknown errors", async () => {
    mockSearchTags.mockRejectedValue(new Error("boom"));
    const res = await searchTagsAction("cafe");
    expect(res.isSuccess).toBe(false);
    expect(res.error).toContain("search failed");
  });
});

// ─── setListTagsAction ────────────────────────────────────────────────────────

describe("setListTagsAction", () => {
  it("rejects when entityId is missing", async () => {
    const res = await setListTagsAction(
      initial as ActionState<never>,
      fd({ tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.fieldErrors.entityId).toBeDefined();
  });

  it("passes parsed labels to the service", async () => {
    mockSetListTags.mockResolvedValue({ tags: [] });
    const res = await setListTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "list-1", tags: JSON.stringify(["Cafe", "Bar"]) })
    );
    expect(res.isSuccess).toBe(true);
    expect(mockSetListTags).toHaveBeenCalledWith({
      listId: "list-1",
      userId: "user-1",
      labels: ["Cafe", "Bar"],
    });
  });

  it("surfaces TagServiceError messages", async () => {
    mockSetListTags.mockRejectedValue(new TagServiceError("NOT_FOUND", "nope"));
    const res = await setListTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "list-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.error).toBe("nope");
  });
});

// ─── setPlaceTagsAction ───────────────────────────────────────────────────────

describe("setPlaceTagsAction", () => {
  it("passes parsed labels to setPlaceTags", async () => {
    mockSetPlaceTags.mockResolvedValue({ tags: [] });
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: JSON.stringify(["Bar"]) })
    );
    expect(res.isSuccess).toBe(true);
    expect(mockSetPlaceTags).toHaveBeenCalledWith({
      placeId: "place-1",
      userId: "user-1",
      labels: ["Bar"],
    });
  });

  it("returns unauthenticated error when session is absent", async () => {
    mockRequireAuth.mockResolvedValue({ error: "Not logged in" });
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.error).toBe("Not logged in");
  });
});
