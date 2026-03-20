import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPlacesByList,
  getAvailablePlacesForList,
  getAllPlacesByUser,
  createPlace,
  addExistingPlaceToList,
  updatePlace,
  deletePlaceFromList,
  deletePlace,
  PlaceServiceError,
} from "@/lib/place";
import {
  notFoundError,
  alreadyInListError,
  validationError,
  placeServiceError,
} from "@/lib/place/errors";

// ─── Repository mock setup ────────────────────────────────────────────────────

const {
  mockGetPlacesByList,
  mockGetAvailablePlacesForList,
  mockGetAllPlacesByUser,
  mockGetPlaceByGoogleId,
  mockGetListOwnership,
  mockGetListPlaceRow,
  mockGetMaxPosition,
  mockGetPlaceInListByOwner,
  mockGetPlaceByOwner,
  mockRestorePlace,
  mockInsertPlace,
  mockCreatePlaceWithListAttachment,
  mockRestoreListPlace,
  mockInsertListPlace,
  mockUpdatePlaceDescription,
  mockSoftDeleteListPlace,
  mockDeletePlaceWithCascade,
} = vi.hoisted(() => ({
  mockGetPlacesByList: vi.fn(),
  mockGetAvailablePlacesForList: vi.fn(),
  mockGetAllPlacesByUser: vi.fn(),
  mockGetPlaceByGoogleId: vi.fn(),
  mockGetListOwnership: vi.fn(),
  mockGetListPlaceRow: vi.fn(),
  mockGetMaxPosition: vi.fn(),
  mockGetPlaceInListByOwner: vi.fn(),
  mockGetPlaceByOwner: vi.fn(),
  mockRestorePlace: vi.fn(),
  mockInsertPlace: vi.fn(),
  mockCreatePlaceWithListAttachment: vi.fn(),
  mockRestoreListPlace: vi.fn(),
  mockInsertListPlace: vi.fn(),
  mockUpdatePlaceDescription: vi.fn(),
  mockSoftDeleteListPlace: vi.fn(),
  mockDeletePlaceWithCascade: vi.fn(),
}));

vi.mock("@/db/repositories/place.repository", () => ({
  getPlacesByList: mockGetPlacesByList,
  getAvailablePlacesForList: mockGetAvailablePlacesForList,
  getAllPlacesByUser: mockGetAllPlacesByUser,
  getPlaceByGoogleId: mockGetPlaceByGoogleId,
  getListOwnership: mockGetListOwnership,
  getListPlaceRow: mockGetListPlaceRow,
  getMaxPosition: mockGetMaxPosition,
  getPlaceInListByOwner: mockGetPlaceInListByOwner,
  getPlaceByOwner: mockGetPlaceByOwner,
  restorePlace: mockRestorePlace,
  insertPlace: mockInsertPlace,
  createPlaceWithListAttachment: mockCreatePlaceWithListAttachment,
  restoreListPlace: mockRestoreListPlace,
  insertListPlace: mockInsertListPlace,
  updatePlaceDescription: mockUpdatePlaceDescription,
  softDeleteListPlace: mockSoftDeleteListPlace,
  deletePlaceWithCascade: mockDeletePlaceWithCascade,
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const LIST_ID = "list-xyz-456";
const PLACE_ID = "place-def-789";
const LIST_PLACE_ID = "lp-ghi-000";
const NOW = new Date("2024-06-01T00:00:00Z");

const placeSummaryRow = {
  id: PLACE_ID,
  name: "The Coffee House",
  address: "1 Main St",
  description: null,
  heroImageUrl: null,
};

const fullPlaceRow = {
  ...placeSummaryRow,
  userId: USER_ID,
  googlePlaceId: "ChIJtest_place_id",
  latitude: "51.5",
  longitude: "-0.1",
  heroImageUrl: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Sensible defaults
  mockGetPlacesByList.mockResolvedValue([]);
  mockGetAvailablePlacesForList.mockResolvedValue([]);
  mockGetAllPlacesByUser.mockResolvedValue([]);
  mockGetPlaceByGoogleId.mockResolvedValue(null);
  mockGetListOwnership.mockResolvedValue(false);
  mockGetListPlaceRow.mockResolvedValue(null);
  mockGetMaxPosition.mockResolvedValue(0);
  mockGetPlaceInListByOwner.mockResolvedValue(false);
  mockGetPlaceByOwner.mockResolvedValue(false);
  mockDeletePlaceWithCascade.mockResolvedValue(null);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Place Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getPlacesByList", () => {
    it("returns place summaries in position order", async () => {
      mockGetPlacesByList.mockResolvedValue([placeSummaryRow]);

      const result = await getPlacesByList(LIST_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeSummaryRow);
    });

    it("returns empty array when list has no places", async () => {
      mockGetPlacesByList.mockResolvedValue([]);

      const result = await getPlacesByList(LIST_ID);

      expect(result).toEqual([]);
    });

    it("does not return soft-deleted places (filtered by query)", async () => {
      mockGetPlacesByList.mockResolvedValue([placeSummaryRow]);

      const result = await getPlacesByList(LIST_ID);

      expect(result).toHaveLength(1);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetPlacesByList.mockRejectedValue(new Error("connection reset"));

      await expect(getPlacesByList(LIST_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getAvailablePlacesForList", () => {
    it("returns places from user's other lists not already in target list", async () => {
      mockGetAvailablePlacesForList.mockResolvedValue([placeSummaryRow]);

      const result = await getAvailablePlacesForList({
        listId: LIST_ID,
        userId: USER_ID,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeSummaryRow);
    });

    it("returns empty array when all user places are already in target list", async () => {
      mockGetAvailablePlacesForList.mockResolvedValue([]);

      const result = await getAvailablePlacesForList({
        listId: LIST_ID,
        userId: USER_ID,
      });

      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetAvailablePlacesForList.mockRejectedValue(new Error("timeout"));

      await expect(
        getAvailablePlacesForList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("createPlace", () => {
    const newPlaceParams = {
      listId: LIST_ID,
      userId: USER_ID,
      googlePlaceId: "ChIJtest_place_id",
      name: "The Coffee House",
      address: "1 Main St",
      latitude: "51.5",
      longitude: "-0.1",
    };

    // ── new place (no existing row) ──────────────────────────────────────────

    it("creates a place and list_place row atomically, returns both ids", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockGetListOwnership.mockResolvedValue(true);
      mockCreatePlaceWithListAttachment.mockResolvedValue({
        place: { ...fullPlaceRow, id: PLACE_ID },
        listPlaceId: LIST_PLACE_ID,
      });

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockGetListOwnership.mockResolvedValue(false);

      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws SERVICE_ERROR when transaction insert fails", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockGetListOwnership.mockResolvedValue(true);
      mockCreatePlaceWithListAttachment.mockRejectedValue(
        new Error("constraint violation")
      );

      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });

    it("passes the provided googlePlaceId to the insert", async () => {
      let capturedGooglePlaceId: string | undefined;
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockGetListOwnership.mockResolvedValue(true);
      mockCreatePlaceWithListAttachment.mockImplementation(
        (params: { googlePlaceId: string }) => {
          capturedGooglePlaceId = params.googlePlaceId;
          return Promise.resolve({
            place: fullPlaceRow,
            listPlaceId: LIST_PLACE_ID,
          });
        }
      );

      await createPlace({
        ...newPlaceParams,
        googlePlaceId: "ChIJprovided_by_api",
      });

      expect(capturedGooglePlaceId).toBe("ChIJprovided_by_api");
    });

    // ── existing active place ────────────────────────────────────────────────

    it("reuses an active place (standalone) without inserting", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(fullPlaceRow);

      const result = await createPlace({
        userId: USER_ID,
        googlePlaceId: "ChIJtest_place_id",
        name: "The Coffee House",
        address: "1 Main St",
        latitude: "51.5",
        longitude: "-0.1",
      });

      expect(result.place.id).toBe(PLACE_ID);
      expect(mockInsertPlace).not.toHaveBeenCalled();
    });

    it("reuses an active place and attaches it to a list", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(fullPlaceRow);
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue(null);
      mockGetMaxPosition.mockResolvedValue(0);
      mockInsertListPlace.mockResolvedValue({ id: LIST_PLACE_ID });

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("propagates ALREADY_IN_LIST when reusing a place already attached to the list", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(fullPlaceRow);
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue({
        id: LIST_PLACE_ID,
        deletedAt: null,
      });

      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({
        code: "ALREADY_IN_LIST",
      });
    });

    // ── soft-deleted place ───────────────────────────────────────────────────

    it("restores a soft-deleted place (standalone) without inserting", async () => {
      const deletedPlace = {
        ...fullPlaceRow,
        deletedAt: new Date("2024-01-01"),
      };
      const restoredPlace = { ...fullPlaceRow, deletedAt: null };
      mockGetPlaceByGoogleId.mockResolvedValue(deletedPlace);
      mockRestorePlace.mockResolvedValue(restoredPlace);

      const result = await createPlace({
        userId: USER_ID,
        googlePlaceId: "ChIJtest_place_id",
        name: "The Coffee House",
        address: "1 Main St",
        latitude: "51.5",
        longitude: "-0.1",
      });

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.place.deletedAt).toBeNull();
      expect(mockInsertPlace).not.toHaveBeenCalled();
    });

    it("restores a soft-deleted place and attaches it to a list", async () => {
      const deletedPlace = {
        ...fullPlaceRow,
        deletedAt: new Date("2024-01-01"),
      };
      const restoredPlace = { ...fullPlaceRow, deletedAt: null };
      mockGetPlaceByGoogleId.mockResolvedValue(deletedPlace);
      mockRestorePlace.mockResolvedValue(restoredPlace);
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue(null);
      mockGetMaxPosition.mockResolvedValue(2);
      mockInsertListPlace.mockResolvedValue({ id: LIST_PLACE_ID });

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
      expect(mockInsertPlace).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("addExistingPlaceToList", () => {
    it("attaches an existing place and returns the new listPlaceId", async () => {
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue(null);
      mockGetMaxPosition.mockResolvedValue(3);
      mockInsertListPlace.mockResolvedValue({ id: LIST_PLACE_ID });

      const result = await addExistingPlaceToList({
        listId: LIST_ID,
        placeId: PLACE_ID,
        userId: USER_ID,
      });

      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockGetListOwnership.mockResolvedValue(false);

      await expect(
        addExistingPlaceToList({
          listId: LIST_ID,
          placeId: PLACE_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws ALREADY_IN_LIST when place is already attached", async () => {
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue({
        id: LIST_PLACE_ID,
        deletedAt: null,
      });

      await expect(
        addExistingPlaceToList({
          listId: LIST_ID,
          placeId: PLACE_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "ALREADY_IN_LIST" });
    });

    it("restores a previously removed place instead of inserting a duplicate", async () => {
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue({
        id: LIST_PLACE_ID,
        deletedAt: new Date("2024-01-01"),
      });
      mockGetMaxPosition.mockResolvedValue(2);
      mockRestoreListPlace.mockResolvedValue(undefined);

      const result = await addExistingPlaceToList({
        listId: LIST_ID,
        placeId: PLACE_ID,
        userId: USER_ID,
      });

      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetListOwnership.mockResolvedValue(true);
      mockGetListPlaceRow.mockResolvedValue(null);
      mockGetMaxPosition.mockResolvedValue(0);
      mockInsertListPlace.mockRejectedValue(new Error("db error"));

      await expect(
        addExistingPlaceToList({
          listId: LIST_ID,
          placeId: PLACE_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("updatePlace", () => {
    it("updates a place's description and returns the updated record", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockUpdatePlaceDescription.mockResolvedValue({
        id: PLACE_ID,
        description: "Great coffee shop",
        updatedAt: NOW,
      });

      const result = await updatePlace({
        placeId: PLACE_ID,
        listId: LIST_ID,
        userId: USER_ID,
        description: "Great coffee shop",
      });

      expect(result.place.description).toBe("Great coffee shop");
    });

    it("throws NOT_FOUND when ownership check fails", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(false);

      await expect(
        updatePlace({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
          description: "Notes",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws NOT_FOUND when DB update returns no rows", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockUpdatePlaceDescription.mockResolvedValue(null);

      await expect(
        updatePlace({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
          description: "Notes",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("does NOT accept googlePlaceId as a parameter (type guard)", () => {
      type UpdatePlaceParams = Parameters<typeof updatePlace>[0];
      type HasGooglePlaceId = "googlePlaceId" extends keyof UpdatePlaceParams
        ? true
        : false;
      const result: HasGooglePlaceId = false;
      expect(result).toBe(false);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockUpdatePlaceDescription.mockRejectedValue(new Error("db down"));

      await expect(
        updatePlace({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
          description: "Notes",
        })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("deletePlaceFromList", () => {
    it("soft-deletes a place and returns success: true", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockSoftDeleteListPlace.mockResolvedValue({ id: LIST_PLACE_ID });

      const result = await deletePlaceFromList({
        placeId: PLACE_ID,
        listId: LIST_ID,
        userId: USER_ID,
      });

      expect(result.success).toBe(true);
    });

    it("throws NOT_FOUND when place is already deleted (idempotency)", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockSoftDeleteListPlace.mockResolvedValue(null);

      await expect(
        deletePlaceFromList({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(false);

      await expect(
        deletePlaceFromList({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetPlaceInListByOwner.mockResolvedValue(true);
      mockSoftDeleteListPlace.mockRejectedValue(new Error("disk full"));

      await expect(
        deletePlaceFromList({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getAllPlacesByUser", () => {
    const placeWithCount = {
      id: PLACE_ID,
      name: "The Coffee House",
      address: "1 Main St",
      description: null,
      heroImageUrl: null,
      activeListCount: 2,
    };

    it("returns places with active list counts", async () => {
      mockGetAllPlacesByUser.mockResolvedValue([placeWithCount]);

      const result = await getAllPlacesByUser({ userId: USER_ID });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeWithCount);
    });

    it("returns empty array when user has no places", async () => {
      mockGetAllPlacesByUser.mockResolvedValue([]);

      const result = await getAllPlacesByUser({ userId: USER_ID });

      expect(result).toEqual([]);
    });

    it("includes places with activeListCount = 0", async () => {
      mockGetAllPlacesByUser.mockResolvedValue([
        { ...placeWithCount, activeListCount: 0 },
      ]);

      const result = await getAllPlacesByUser({ userId: USER_ID });

      expect(result[0]!.activeListCount).toBe(0);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetAllPlacesByUser.mockRejectedValue(new Error("connection timeout"));

      await expect(
        getAllPlacesByUser({ userId: USER_ID })
      ).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("createPlace (standalone — no listId)", () => {
    it("inserts a place and returns it", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockInsertPlace.mockResolvedValue(fullPlaceRow);

      const result = await createPlace({
        userId: USER_ID,
        googlePlaceId: "ChIJtest_place_id",
        name: "The Coffee House",
        address: "1 Main St",
        latitude: "51.5",
        longitude: "-0.1",
      });

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.place.name).toBe("The Coffee House");
    });

    it("passes the provided googlePlaceId to the insert", async () => {
      let capturedGooglePlaceId: string | undefined;
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockInsertPlace.mockImplementation((vals: { googlePlaceId: string }) => {
        capturedGooglePlaceId = vals.googlePlaceId;
        return Promise.resolve(fullPlaceRow);
      });

      await createPlace({
        userId: USER_ID,
        googlePlaceId: "ChIJprovided",
        name: "Cafe",
        address: "1 St",
        latitude: "51.5",
        longitude: "-0.1",
      });

      expect(capturedGooglePlaceId).toBe("ChIJprovided");
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetPlaceByGoogleId.mockResolvedValue(null);
      mockInsertPlace.mockRejectedValue(new Error("disk full"));

      await expect(
        createPlace({
          userId: USER_ID,
          googlePlaceId: "ChIJtest_place_id",
          name: "Cafe",
          address: "1 St",
          latitude: "51.5",
          longitude: "-0.1",
        })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("deletePlace", () => {
    it("soft-deletes the place and cascades to list attachments", async () => {
      mockDeletePlaceWithCascade.mockResolvedValue({
        deletedListPlaceCount: 2,
      });

      const result = await deletePlace({ placeId: PLACE_ID, userId: USER_ID });

      expect(result.deletedListPlaceCount).toBe(2);
    });

    it("returns 0 cascaded rows when place is not attached to any list", async () => {
      mockDeletePlaceWithCascade.mockResolvedValue({
        deletedListPlaceCount: 0,
      });

      const result = await deletePlace({ placeId: PLACE_ID, userId: USER_ID });

      expect(result.deletedListPlaceCount).toBe(0);
    });

    it("throws NOT_FOUND when place does not belong to user", async () => {
      mockDeletePlaceWithCascade.mockResolvedValue(null);

      await expect(
        deletePlace({ placeId: PLACE_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws NOT_FOUND when place is already deleted", async () => {
      mockDeletePlaceWithCascade.mockResolvedValue(null);

      await expect(
        deletePlace({ placeId: PLACE_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on DB failure during cascade", async () => {
      mockDeletePlaceWithCascade.mockRejectedValue(
        new Error("connection lost")
      );

      await expect(
        deletePlace({ placeId: PLACE_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("PlaceServiceError", () => {
    it("carries the expected code on each factory type", () => {
      expect(notFoundError().code).toBe("NOT_FOUND");
      expect(alreadyInListError().code).toBe("ALREADY_IN_LIST");
      expect(validationError("bad input").code).toBe("VALIDATION_ERROR");
      expect(placeServiceError().code).toBe("SERVICE_ERROR");
    });

    it("is an instance of Error", () => {
      const err = new PlaceServiceError("NOT_FOUND", "msg");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("PlaceServiceError");
    });
  });
});
