import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { mockRequireAuth } = vi.hoisted(() => ({ mockRequireAuth: vi.fn() }));
vi.mock("@/lib/utils/actions", () => ({
  requireAuth: mockRequireAuth,
}));

const { mockSearchTags, mockSetPlaceTags } = vi.hoisted(() => ({
  mockSearchTags: vi.fn(),
  mockSetPlaceTags: vi.fn(),
}));
vi.mock("@/lib/tag", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tag")>();
  return {
    ...actual,
    searchTags: mockSearchTags,
    setPlaceTags: mockSetPlaceTags,
  };
});

vi.mock("@/lib/public", () => ({
  invalidatePublicListCaches: vi.fn().mockResolvedValue(undefined),
}));

// ─── Imports under test ───────────────────────────────────────────────────────

import { searchTagsAction, setPlaceTagsAction } from "@/actions/tag-actions";
import { TagServiceError } from "@/lib/tag";
import { invalidatePublicListCaches } from "@/lib/public";
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

// ─── setPlaceTagsAction ───────────────────────────────────────────────────────

describe("setPlaceTagsAction", () => {
  it("passes parsed labels to setPlaceTags", async () => {
    mockSetPlaceTags.mockResolvedValue({ tags: [], listSlugs: [] });
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

  it("invalidates list detail caches for all lists containing the place", async () => {
    mockSetPlaceTags.mockResolvedValue({
      tags: [],
      listSlugs: ["list-a", "list-b"],
    });
    await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(invalidatePublicListCaches).toHaveBeenCalledWith(
      "user-1",
      "list-a",
      "list-b"
    );
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

  it("rejects when entityId is missing", async () => {
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.fieldErrors.entityId).toBeDefined();
  });

  it("surfaces TagServiceError messages", async () => {
    mockSetPlaceTags.mockRejectedValue(
      new TagServiceError("NOT_FOUND", "place not found")
    );
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.error).toBe("place not found");
  });

  it("uses a generic message for unknown errors", async () => {
    mockSetPlaceTags.mockRejectedValue(new Error("unexpected"));
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(false);
    expect(res.error).toContain("Failed to update tags");
  });

  it("proceeds normally when cache invalidation throws", async () => {
    mockSetPlaceTags.mockResolvedValue({ tags: [], listSlugs: ["list-a"] });
    const { invalidatePublicListCaches: mockInvalidate } =
      await import("@/lib/public");
    (mockInvalidate as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("cache down")
    );
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(true);
  });

  it("treats absent tags field as an empty array (null ?? '' fallback)", async () => {
    mockSetPlaceTags.mockResolvedValue({ tags: [] });
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1" })
    );
    expect(res.isSuccess).toBe(true);
    expect(mockSetPlaceTags).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [] })
    );
  });

  it("spreads empty array when setPlaceTags returns undefined listSlugs", async () => {
    mockSetPlaceTags.mockResolvedValue({ tags: [] });
    const res = await setPlaceTagsAction(
      initial as ActionState<never>,
      fd({ entityId: "place-1", tags: "[]" })
    );
    expect(res.isSuccess).toBe(true);
  });
});
