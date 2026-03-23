import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchTags,
  getTagsForPlace,
  getTagsForListsViaPlaces,
  setPlaceTags,
  TagServiceError,
} from "@/lib/tag";

// ─── Repository mock setup ────────────────────────────────────────────────────

const repo = vi.hoisted(() => ({
  searchTagsBySlugPrefix: vi.fn(),
  getTagsBySlugs: vi.fn(),
  insertTags: vi.fn(),
  isPlaceOwnedByUser: vi.fn(),
  getTagsForPlace: vi.fn(),
  getTagsForPlaces: vi.fn(),
  getPlaceTagIds: vi.fn(),
  insertPlaceTags: vi.fn(),
  deletePlaceTagsByTagIds: vi.fn(),
  deleteOrphanedCustomTags: vi.fn(),
  getTagsForListsViaPlaces: vi.fn(),
}));

vi.mock("@/db/repositories/tag.repository", () => repo);

const placeRepo = vi.hoisted(() => ({
  getPublishedListSlugsForPlace: vi.fn(),
}));

vi.mock("@/db/repositories/place.repository", () => placeRepo);

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc";
const LIST_ID = "list-123";
const PLACE_ID = "place-456";

const tagCafe = { id: "t1", slug: "cafe", label: "Cafe", isSystem: true };
const tagBar = { id: "t2", slug: "bar", label: "Bar", isSystem: true };
const tagCustom = {
  id: "t3",
  slug: "hidden-gem",
  label: "Hidden Gem",
  isSystem: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── searchTags ───────────────────────────────────────────────────────────────

describe("searchTags", () => {
  it("normalises the query and returns matches", async () => {
    repo.searchTagsBySlugPrefix.mockResolvedValue([tagCafe]);
    const result = await searchTags({ query: "Cafe!", userId: USER_ID });
    expect(repo.searchTagsBySlugPrefix).toHaveBeenCalledWith({
      slugPrefix: "cafe",
      userId: USER_ID,
      limit: 10,
    });
    expect(result).toEqual([tagCafe]);
  });

  it("returns empty array for an empty normalised query without hitting the DB", async () => {
    const result = await searchTags({ query: "!!!", userId: USER_ID });
    expect(result).toEqual([]);
    expect(repo.searchTagsBySlugPrefix).not.toHaveBeenCalled();
  });

  it("wraps DB errors in TagServiceError", async () => {
    repo.searchTagsBySlugPrefix.mockRejectedValue(new Error("boom"));
    await expect(
      searchTags({ query: "cafe", userId: USER_ID })
    ).rejects.toBeInstanceOf(TagServiceError);
  });
});

// ─── getTagsForPlace ──────────────────────────────────────────────────────────

describe("getTagsForPlace", () => {
  it("delegates to the repository", async () => {
    repo.getTagsForPlace.mockResolvedValue([tagCafe]);
    const result = await getTagsForPlace(PLACE_ID);
    expect(repo.getTagsForPlace).toHaveBeenCalledWith(PLACE_ID);
    expect(result).toEqual([tagCafe]);
  });

  it("wraps DB errors", async () => {
    repo.getTagsForPlace.mockRejectedValue(new Error("boom"));
    await expect(getTagsForPlace(PLACE_ID)).rejects.toBeInstanceOf(
      TagServiceError
    );
  });
});

// ─── getTagsForListsViaPlaces ─────────────────────────────────────────────────

describe("getTagsForListsViaPlaces", () => {
  it("delegates to the repository", async () => {
    const entityRow = { ...tagCafe, entityId: LIST_ID };
    repo.getTagsForListsViaPlaces.mockResolvedValue([entityRow]);
    const result = await getTagsForListsViaPlaces([LIST_ID]);
    expect(repo.getTagsForListsViaPlaces).toHaveBeenCalledWith([LIST_ID]);
    expect(result).toEqual([entityRow]);
  });

  it("wraps DB errors", async () => {
    repo.getTagsForListsViaPlaces.mockRejectedValue(new Error("boom"));
    await expect(getTagsForListsViaPlaces([LIST_ID])).rejects.toBeInstanceOf(
      TagServiceError
    );
  });
});

// ─── setPlaceTags ─────────────────────────────────────────────────────────────

describe("setPlaceTags", () => {
  beforeEach(() => {
    repo.isPlaceOwnedByUser.mockResolvedValue(true);
    repo.getTagsBySlugs.mockResolvedValue([]);
    repo.insertTags.mockResolvedValue([]);
    repo.getPlaceTagIds.mockResolvedValue([]);
    repo.insertPlaceTags.mockResolvedValue(undefined);
    repo.deletePlaceTagsByTagIds.mockResolvedValue(undefined);
    repo.deleteOrphanedCustomTags.mockResolvedValue(undefined);
    repo.getTagsForPlace.mockResolvedValue([]);
    placeRepo.getPublishedListSlugsForPlace.mockResolvedValue([]);
  });

  it("throws NOT_FOUND when the place is not owned by the user", async () => {
    repo.isPlaceOwnedByUser.mockResolvedValue(false);
    await expect(
      setPlaceTags({ placeId: PLACE_ID, userId: USER_ID, labels: ["Bar"] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws VALIDATION_ERROR when labels exceed the max", async () => {
    const labels = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    await expect(
      setPlaceTags({ placeId: PLACE_ID, userId: USER_ID, labels })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("inserts new custom tags when no existing match", async () => {
    const customRow = { ...tagCustom, userId: USER_ID, createdAt: new Date() };
    // First call: nothing found; second call (after insert): tag now exists
    repo.getTagsBySlugs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([customRow]);
    repo.insertTags.mockResolvedValue([customRow]);
    repo.getTagsForPlace.mockResolvedValue([tagCustom]);

    const { tags } = await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Hidden Gem"],
    });

    expect(repo.insertTags).toHaveBeenCalledWith([
      { slug: "hidden-gem", label: "Hidden Gem", userId: USER_ID },
    ]);
    expect(repo.insertPlaceTags).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      tagIds: ["t3"],
    });
    expect(tags).toEqual([tagCustom]);
  });

  it("reuses existing tag rows instead of inserting duplicates", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForPlace.mockResolvedValue([tagCafe]);

    await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Cafe"],
    });

    expect(repo.insertTags).not.toHaveBeenCalled();
    expect(repo.insertPlaceTags).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      tagIds: ["t1"],
    });
  });

  it("hard-deletes removed tags from the junction table", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    // current: cafe + custom; desired: cafe only → custom (t3) should be removed
    repo.getPlaceTagIds.mockResolvedValue([
      { id: "j1", tagId: "t1" },
      { id: "j2", tagId: "t3" },
    ]);
    repo.getTagsForPlace.mockResolvedValue([tagCafe]);

    await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Cafe"],
    });

    expect(repo.deletePlaceTagsByTagIds).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      tagIds: ["t3"],
    });
    expect(repo.deleteOrphanedCustomTags).toHaveBeenCalledWith(["t3"]);
  });

  it("does not call deleteOrphanedCustomTags when nothing is removed", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getPlaceTagIds.mockResolvedValue([]);
    repo.getTagsForPlace.mockResolvedValue([tagCafe]);

    await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Cafe"],
    });

    expect(repo.deleteOrphanedCustomTags).not.toHaveBeenCalled();
  });

  it("de-duplicates labels that normalise to the same slug", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForPlace.mockResolvedValue([tagCafe]);

    await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Cafe", "cafe", "CAFE!"],
    });

    expect(repo.getTagsBySlugs).toHaveBeenCalledWith({
      slugs: ["cafe"],
      userId: USER_ID,
    });
  });

  it("clears all tags when given an empty label array", async () => {
    repo.getPlaceTagIds.mockResolvedValue([{ id: "j1", tagId: "t1" }]);
    repo.getTagsForPlace.mockResolvedValue([]);

    const { tags } = await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: [],
    });

    expect(repo.deletePlaceTagsByTagIds).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      tagIds: ["t1"],
    });
    expect(repo.deleteOrphanedCustomTags).toHaveBeenCalledWith(["t1"]);
    expect(tags).toEqual([]);
  });

  it("returns listSlugs from published lists containing the place", async () => {
    placeRepo.getPublishedListSlugsForPlace.mockResolvedValue([
      "my-list",
      "another-list",
    ]);
    repo.getTagsForPlace.mockResolvedValue([tagBar]);

    const result = await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Bar"],
    });

    expect(result.listSlugs).toEqual(["my-list", "another-list"]);
    expect(placeRepo.getPublishedListSlugsForPlace).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      userId: USER_ID,
    });
  });

  it("wraps DB errors in SERVICE_ERROR", async () => {
    repo.getTagsBySlugs.mockRejectedValue(new Error("boom"));
    await expect(
      setPlaceTags({ placeId: PLACE_ID, userId: USER_ID, labels: ["Cafe"] })
    ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
  });
});
