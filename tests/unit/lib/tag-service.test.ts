import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchTags,
  getTagsForList,
  getTagsForPlace,
  setListTags,
  setPlaceTags,
  TagServiceError,
} from "@/lib/tag";

// ─── Repository mock setup ────────────────────────────────────────────────────

const repo = vi.hoisted(() => ({
  searchTagsBySlugPrefix: vi.fn(),
  getTagsBySlugs: vi.fn(),
  insertTags: vi.fn(),
  isListOwnedByUser: vi.fn(),
  isPlaceOwnedByUser: vi.fn(),
  getTagsForList: vi.fn(),
  getListTagJunctions: vi.fn(),
  insertListTags: vi.fn(),
  restoreListTags: vi.fn(),
  softDeleteListTags: vi.fn(),
  getTagsForPlace: vi.fn(),
  getPlaceTagJunctions: vi.fn(),
  insertPlaceTags: vi.fn(),
  restorePlaceTags: vi.fn(),
  softDeletePlaceTags: vi.fn(),
  getTagsForLists: vi.fn(),
  getTagsForPlaces: vi.fn(),
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

// ─── getTagsForList / getTagsForPlace ─────────────────────────────────────────

describe("getTagsForList", () => {
  it("delegates to the repository", async () => {
    repo.getTagsForList.mockResolvedValue([tagCafe, tagBar]);
    const result = await getTagsForList(LIST_ID);
    expect(repo.getTagsForList).toHaveBeenCalledWith(LIST_ID);
    expect(result).toEqual([tagCafe, tagBar]);
  });

  it("wraps DB errors", async () => {
    repo.getTagsForList.mockRejectedValue(new Error("boom"));
    await expect(getTagsForList(LIST_ID)).rejects.toBeInstanceOf(
      TagServiceError
    );
  });
});

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

// ─── setListTags ──────────────────────────────────────────────────────────────

describe("setListTags", () => {
  beforeEach(() => {
    repo.isListOwnedByUser.mockResolvedValue({ slug: "list-slug" });
    repo.getTagsBySlugs.mockResolvedValue([]);
    repo.insertTags.mockResolvedValue([]);
    repo.getListTagJunctions.mockResolvedValue([]);
    repo.restoreListTags.mockResolvedValue(undefined);
    repo.softDeleteListTags.mockResolvedValue(undefined);
    repo.insertListTags.mockResolvedValue(undefined);
    repo.getTagsForList.mockResolvedValue([]);
  });

  it("throws NOT_FOUND when the list is not owned by the user", async () => {
    repo.isListOwnedByUser.mockResolvedValue(null);
    await expect(
      setListTags({ listId: LIST_ID, userId: USER_ID, labels: ["Cafe"] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws VALIDATION_ERROR when labels exceed the max", async () => {
    const labels = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    await expect(
      setListTags({ listId: LIST_ID, userId: USER_ID, labels })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("inserts new custom tags when no existing match", async () => {
    repo.getTagsBySlugs.mockResolvedValue([]);
    repo.insertTags.mockResolvedValue([
      { ...tagCustom, userId: USER_ID, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForList.mockResolvedValue([tagCustom]);

    const { tags } = await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: ["Hidden Gem"],
    });

    expect(repo.insertTags).toHaveBeenCalledWith([
      { slug: "hidden-gem", label: "Hidden Gem", userId: USER_ID },
    ]);
    expect(repo.insertListTags).toHaveBeenCalledWith({
      listId: LIST_ID,
      tagIds: ["t3"],
    });
    expect(tags).toEqual([tagCustom]);
  });

  it("reuses existing tag rows instead of inserting duplicates", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForList.mockResolvedValue([tagCafe]);

    await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: ["Cafe"],
    });

    expect(repo.insertTags).not.toHaveBeenCalled();
    expect(repo.insertListTags).toHaveBeenCalledWith({
      listId: LIST_ID,
      tagIds: ["t1"],
    });
  });

  it("computes diff: restores soft-deleted, soft-deletes removed, inserts new", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
      { ...tagBar, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getListTagJunctions.mockResolvedValue([
      // Cafe was previously removed → should be restored
      { id: "j1", tagId: "t1", deletedAt: new Date() },
      // Custom tag is active but not in the new set → should be soft-deleted
      { id: "j2", tagId: "t3", deletedAt: null },
    ]);
    repo.getTagsForList.mockResolvedValue([tagCafe, tagBar]);

    await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: ["Cafe", "Bar"],
    });

    expect(repo.restoreListTags).toHaveBeenCalledWith(["j1"]);
    expect(repo.softDeleteListTags).toHaveBeenCalledWith(["j2"]);
    expect(repo.insertListTags).toHaveBeenCalledWith({
      listId: LIST_ID,
      tagIds: ["t2"],
    });
  });

  it("de-duplicates labels that normalise to the same slug", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagCafe, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForList.mockResolvedValue([tagCafe]);

    await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: ["Cafe", "cafe", "CAFE!"],
    });

    expect(repo.getTagsBySlugs).toHaveBeenCalledWith({
      slugs: ["cafe"],
      userId: USER_ID,
    });
  });

  it("clears all tags when given an empty label array", async () => {
    repo.getListTagJunctions.mockResolvedValue([
      { id: "j1", tagId: "t1", deletedAt: null },
    ]);
    repo.getTagsForList.mockResolvedValue([]);

    const { tags } = await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: [],
    });

    expect(repo.softDeleteListTags).toHaveBeenCalledWith(["j1"]);
    expect(repo.insertListTags).toHaveBeenCalledWith({
      listId: LIST_ID,
      tagIds: [],
    });
    expect(tags).toEqual([]);
  });

  it("wraps DB errors in SERVICE_ERROR", async () => {
    repo.getTagsBySlugs.mockRejectedValue(new Error("boom"));
    await expect(
      setListTags({ listId: LIST_ID, userId: USER_ID, labels: ["Cafe"] })
    ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
  });

  it("returns listSlug in the result", async () => {
    repo.getTagsForList.mockResolvedValue([tagCafe]);

    const result = await setListTags({
      listId: LIST_ID,
      userId: USER_ID,
      labels: ["Cafe"],
    });

    expect(result.listSlug).toBe("list-slug");
  });
});

// ─── setPlaceTags ─────────────────────────────────────────────────────────────

describe("setPlaceTags", () => {
  beforeEach(() => {
    repo.isPlaceOwnedByUser.mockResolvedValue(true);
    repo.getTagsBySlugs.mockResolvedValue([]);
    repo.insertTags.mockResolvedValue([]);
    repo.getPlaceTagJunctions.mockResolvedValue([]);
    repo.restorePlaceTags.mockResolvedValue(undefined);
    repo.softDeletePlaceTags.mockResolvedValue(undefined);
    repo.insertPlaceTags.mockResolvedValue(undefined);
    repo.getTagsForPlace.mockResolvedValue([]);
    placeRepo.getPublishedListSlugsForPlace.mockResolvedValue([]);
  });

  it("throws NOT_FOUND when the place is not owned by the user", async () => {
    repo.isPlaceOwnedByUser.mockResolvedValue(false);
    await expect(
      setPlaceTags({ placeId: PLACE_ID, userId: USER_ID, labels: ["Bar"] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("uses the place repository branch", async () => {
    repo.getTagsBySlugs.mockResolvedValue([
      { ...tagBar, userId: null, createdAt: new Date(), deletedAt: null },
    ]);
    repo.getTagsForPlace.mockResolvedValue([tagBar]);

    await setPlaceTags({
      placeId: PLACE_ID,
      userId: USER_ID,
      labels: ["Bar"],
    });

    expect(repo.isPlaceOwnedByUser).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      userId: USER_ID,
    });
    expect(repo.insertPlaceTags).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      tagIds: ["t2"],
    });
    expect(repo.insertListTags).not.toHaveBeenCalled();
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
});
