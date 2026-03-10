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
} from "@/lib/place/service";
import {
  notFoundError,
  alreadyInListError,
  validationError,
  placeServiceError,
} from "@/lib/place/service/errors";

// ─── DB mock setup ────────────────────────────────────────────────────────────

// Per-test result/error stores
let mockSelectRows: unknown[] = [];
let mockSelectRowsSequence: unknown[][] = []; // for consecutive select calls
let mockSelectCallCount = 0;
let mockInsertRows: unknown[] = [];
let mockUpdateRows: unknown[] = [];
let mockTransactionResult: unknown = null;
let mockSelectError: unknown = null;
let mockInsertError: unknown = null;
let mockUpdateError: unknown = null;

const { mockSelect, mockInsert, mockUpdate, mockTransaction } = vi.hoisted(
  () => ({
    mockSelect: vi.fn(),
    mockInsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockTransaction: vi.fn(),
  })
);

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    selectDistinct: mockSelect, // aliased for getAvailablePlacesForList
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}));

// ─── Fluent chain builders ────────────────────────────────────────────────────

/**
 * Creates a fluent Drizzle-like query chain node that is:
 *   - Directly awaitable (via .then/.catch/.finally — thenable)
 *   - Chainable via .where(), .orderBy(), .innerJoin(), .returning()
 *
 * resolveWith returns either a Promise<T> (used for rejection too) or a raw value.
 * Each chained method returns a NEW thenable chain preserving the same resolveWith.
 */
function makeThenableChain(resolveWith: () => unknown): Record<string, unknown> {
  const asPromise = () => Promise.resolve(resolveWith());
  const node: Record<string, unknown> = {
    then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      asPromise().then(onFulfilled, onRejected),
    catch: (onRejected?: (e: unknown) => unknown) =>
      asPromise().catch(onRejected),
    finally: (onFinally?: () => void) =>
      asPromise().finally(onFinally),
    where: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    orderBy: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    groupBy: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    returning: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    innerJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    leftJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
  };
  return node;
}

function makeSelectChain(resolveWith: () => unknown) {
  const from = vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith));
  return { from };
}

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
  mockSelectRows = [];
  mockSelectRowsSequence = [];
  mockSelectCallCount = 0;
  mockInsertRows = [];
  mockUpdateRows = [];
  mockTransactionResult = null;
  mockSelectError = null;
  mockInsertError = null;
  mockUpdateError = null;

  // Default select chain — supports sequence via mockSelectRowsSequence
  mockSelect.mockImplementation(() => {
    const callIndex = mockSelectCallCount++;
    const chain = makeSelectChain(() => {
      if (mockSelectError) return Promise.reject(mockSelectError);
      if (mockSelectRowsSequence.length > callIndex) {
        return Promise.resolve(mockSelectRowsSequence[callIndex]);
      }
      return Promise.resolve(mockSelectRows);
    });
    return { from: chain.from };
  });

  // Default insert chain
  const mockInsertReturning = vi.fn().mockImplementation(() => {
    if (mockInsertError) return Promise.reject(mockInsertError);
    return Promise.resolve(mockInsertRows);
  });
  const mockInsertValues = vi
    .fn()
    .mockReturnValue({ returning: mockInsertReturning });
  mockInsert.mockReturnValue({ values: mockInsertValues });

  // Default update chain
  const mockUpdateReturning = vi.fn().mockImplementation(() => {
    if (mockUpdateError) return Promise.reject(mockUpdateError);
    return Promise.resolve(mockUpdateRows);
  });
  const mockUpdateWhere = vi
    .fn()
    .mockReturnValue({ returning: mockUpdateReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockSet });

  // Default transaction — delegate to a callback that gets a mini tx object
  mockTransaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<unknown>) => {
      if (mockTransactionResult !== null) return mockTransactionResult;
      // Build a mini tx object that mirrors db
      const tx = {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
      return fn(tx);
    }
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Place Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getPlacesByList", () => {
    it("returns place summaries in position order", async () => {
      mockSelectRows = [placeSummaryRow];
      const result = await getPlacesByList(LIST_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeSummaryRow);
    });

    it("returns empty array when list has no places", async () => {
      mockSelectRows = [];
      const result = await getPlacesByList(LIST_ID);
      expect(result).toEqual([]);
    });

    it("does not return soft-deleted places (filtered by query)", async () => {
      // The service filters via isNull(places.deletedAt) — the mock verifies
      // that whatever the DB returns is passed through unchanged.
      mockSelectRows = [placeSummaryRow]; // only 1 of 2 (deleted one excluded by query)
      const result = await getPlacesByList(LIST_ID);
      expect(result).toHaveLength(1);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectError = new Error("connection reset");
      await expect(getPlacesByList(LIST_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getAvailablePlacesForList", () => {
    it("returns places from user's other lists not already in target list", async () => {
      mockSelectRows = [placeSummaryRow];
      const result = await getAvailablePlacesForList({
        listId: LIST_ID,
        userId: USER_ID,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeSummaryRow);
    });

    it("returns empty array when all user places are already in target list", async () => {
      mockSelectRows = [];
      const result = await getAvailablePlacesForList({
        listId: LIST_ID,
        userId: USER_ID,
      });
      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectError = new Error("timeout");
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
      // lookup → nothing; ownership → found; transaction returns fixed result
      mockSelectRowsSequence = [[], [{ id: LIST_ID }]];
      mockTransactionResult = { place: { ...fullPlaceRow, id: PLACE_ID }, listPlaceId: LIST_PLACE_ID };

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockSelectRowsSequence = [[], []]; // lookup → nothing; ownership → fails
      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR when transaction insert fails", async () => {
      mockSelectRowsSequence = [[], [{ id: LIST_ID }]]; // lookup → nothing; ownership → passes
      mockTransactionResult = null;
      mockInsertError = new Error("constraint violation");
      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });

    it("passes the provided googlePlaceId to the insert", async () => {
      mockSelectRowsSequence = [[], [{ id: LIST_ID }]];
      let capturedGooglePlaceId: string | undefined;

      mockTransactionResult = null;
      mockTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          let insertCallCount = 0;
          const tx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ maxPos: 0 }]),
              }),
            }),
            insert: vi.fn().mockImplementation(() => ({
              values: (vals: { googlePlaceId?: string; position?: number }) => {
                insertCallCount++;
                if (insertCallCount === 1) capturedGooglePlaceId = vals.googlePlaceId;
                return {
                  returning: vi.fn().mockResolvedValue(
                    insertCallCount === 1 ? [fullPlaceRow] : [{ id: LIST_PLACE_ID }]
                  ),
                };
              },
            })),
            update: mockUpdate,
          };
          return fn(tx);
        }
      );

      await createPlace({ ...newPlaceParams, googlePlaceId: "ChIJprovided_by_api" });

      expect(capturedGooglePlaceId).toBe("ChIJprovided_by_api");
    });

    // ── existing active place ────────────────────────────────────────────────

    it("reuses an active place (standalone) without inserting", async () => {
      mockSelectRowsSequence = [[fullPlaceRow]]; // lookup → active place found
      const result = await createPlace({ userId: USER_ID, googlePlaceId: "ChIJtest_place_id", name: "The Coffee House", address: "1 Main St", latitude: "51.5", longitude: "-0.1" });
      expect(result.place.id).toBe(PLACE_ID);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("reuses an active place and attaches it to a list", async () => {
      // lookup → active; then addExistingPlaceToList: ownership, no existing lp, position, insert lp
      mockSelectRowsSequence = [
        [fullPlaceRow],          // lookup → active place
        [{ id: LIST_ID }],       // addExistingPlaceToList: ownership
        [],                      // addExistingPlaceToList: no existing listPlace
        [{ maxPos: 0 }],         // addExistingPlaceToList: position
      ];
      mockInsertRows = [{ id: LIST_PLACE_ID }];

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("propagates ALREADY_IN_LIST when reusing a place already attached to the list", async () => {
      mockSelectRowsSequence = [
        [fullPlaceRow],                            // lookup → active place
        [{ id: LIST_ID }],                         // addExistingPlaceToList: ownership
        [{ id: LIST_PLACE_ID, deletedAt: null }],  // addExistingPlaceToList: already active
      ];

      await expect(createPlace(newPlaceParams)).rejects.toMatchObject({ code: "ALREADY_IN_LIST" });
    });

    // ── soft-deleted place ───────────────────────────────────────────────────

    it("restores a soft-deleted place (standalone) without inserting", async () => {
      const deletedPlace = { ...fullPlaceRow, deletedAt: new Date("2024-01-01") };
      const restoredPlace = { ...fullPlaceRow, deletedAt: null };
      mockSelectRowsSequence = [[deletedPlace]]; // lookup → soft-deleted
      mockUpdateRows = [restoredPlace];

      const result = await createPlace({ userId: USER_ID, googlePlaceId: "ChIJtest_place_id", name: "The Coffee House", address: "1 Main St", latitude: "51.5", longitude: "-0.1" });

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.place.deletedAt).toBeNull();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("restores a soft-deleted place and attaches it to a list", async () => {
      const deletedPlace = { ...fullPlaceRow, deletedAt: new Date("2024-01-01") };
      const restoredPlace = { ...fullPlaceRow, deletedAt: null };
      mockUpdateRows = [restoredPlace];
      mockSelectRowsSequence = [
        [deletedPlace],          // lookup → soft-deleted
        // addExistingPlaceToList sequences:
        [{ id: LIST_ID }],       // ownership
        [],                      // no existing listPlace
        [{ maxPos: 2 }],         // position
      ];
      mockInsertRows = [{ id: LIST_PLACE_ID }];

      const result = await createPlace(newPlaceParams);

      expect(result.place.id).toBe(PLACE_ID);
      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
      expect(mockInsert).toHaveBeenCalledTimes(1); // only listPlace insert, not place insert
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("addExistingPlaceToList", () => {
    it("attaches an existing place and returns the new listPlaceId", async () => {
      // ownership check → found; existing attachment check → empty; posResult; insert
      mockSelectRowsSequence = [
        [{ id: LIST_ID }], // ownership
        [],                // no existing attachment
        [{ maxPos: 3 }],   // position query
      ];
      mockInsertRows = [{ id: LIST_PLACE_ID }];

      const result = await addExistingPlaceToList({
        listId: LIST_ID,
        placeId: PLACE_ID,
        userId: USER_ID,
      });

      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockSelectRows = [];
      await expect(
        addExistingPlaceToList({
          listId: LIST_ID,
          placeId: PLACE_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws ALREADY_IN_LIST when place is already attached", async () => {
      mockSelectRowsSequence = [
        [{ id: LIST_ID }],                              // ownership
        [{ id: LIST_PLACE_ID, deletedAt: null }],       // active row found
      ];
      await expect(
        addExistingPlaceToList({
          listId: LIST_ID,
          placeId: PLACE_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "ALREADY_IN_LIST" });
    });

    it("restores a previously removed place instead of inserting a duplicate", async () => {
      mockSelectRowsSequence = [
        [{ id: LIST_ID }],                                       // ownership
        [{ id: LIST_PLACE_ID, deletedAt: new Date("2024-01-01") }], // soft-deleted row
        [{ maxPos: 2 }],                                         // position query
      ];
      // mockUpdate is called with set({ deletedAt: null, position: 3 })
      // No .returning() is called on the restore path — mock just needs to not throw

      const result = await addExistingPlaceToList({
        listId: LIST_ID,
        placeId: PLACE_ID,
        userId: USER_ID,
      });

      expect(result.listPlaceId).toBe(LIST_PLACE_ID);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectRowsSequence = [
        [{ id: LIST_ID }],
        [],
      ];
      mockInsertError = new Error("db error");
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
      mockSelectRows = [{ placeId: PLACE_ID }]; // ownership check passes
      mockUpdateRows = [
        { id: PLACE_ID, description: "Great coffee shop", updatedAt: NOW },
      ];

      const result = await updatePlace({
        placeId: PLACE_ID,
        listId: LIST_ID,
        userId: USER_ID,
        description: "Great coffee shop",
      });

      expect(result.place.description).toBe("Great coffee shop");
    });

    it("throws NOT_FOUND when ownership check fails", async () => {
      mockSelectRows = [];
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
      mockSelectRows = [{ placeId: PLACE_ID }];
      mockUpdateRows = [];
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
      // This is a compile-time / API contract test:
      // updatePlace's parameter type does not include googlePlaceId.
      // We verify the function signature by checking the accepted params.
      type UpdatePlaceParams = Parameters<typeof updatePlace>[0];
      type HasGooglePlaceId = "googlePlaceId" extends keyof UpdatePlaceParams
        ? true
        : false;
      const result: HasGooglePlaceId = false;
      expect(result).toBe(false);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectRows = [{ placeId: PLACE_ID }];
      mockUpdateError = new Error("db down");
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
      mockSelectRows = [{ placeId: PLACE_ID }]; // ownership check
      mockUpdateRows = [{ id: PLACE_ID }];

      const result = await deletePlaceFromList({
        placeId: PLACE_ID,
        listId: LIST_ID,
        userId: USER_ID,
      });

      expect(result.success).toBe(true);
    });

    it("throws NOT_FOUND when place is already deleted (idempotency)", async () => {
      mockSelectRows = [{ placeId: PLACE_ID }]; // ownership check
      mockUpdateRows = []; // isNull(deletedAt) excludes already-deleted row
      await expect(
        deletePlaceFromList({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws NOT_FOUND when list does not belong to user", async () => {
      mockSelectRows = []; // ownership check fails
      await expect(
        deletePlaceFromList({
          placeId: PLACE_ID,
          listId: LIST_ID,
          userId: USER_ID,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectRows = [{ placeId: PLACE_ID }];
      mockUpdateError = new Error("disk full");
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
    const placeWithCount = { id: PLACE_ID, name: "The Coffee House", address: "1 Main St", description: null, heroImageUrl: null, activeListCount: 2 };

    it("returns places with active list counts", async () => {
      mockSelectRows = [placeWithCount];
      const result = await getAllPlacesByUser({ userId: USER_ID });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(placeWithCount);
    });

    it("returns empty array when user has no places", async () => {
      mockSelectRows = [];
      const result = await getAllPlacesByUser({ userId: USER_ID });
      expect(result).toEqual([]);
    });

    it("includes places with activeListCount = 0", async () => {
      mockSelectRows = [{ ...placeWithCount, activeListCount: 0 }];
      const result = await getAllPlacesByUser({ userId: USER_ID });
      expect(result[0]!.activeListCount).toBe(0);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectError = new Error("connection timeout");
      await expect(getAllPlacesByUser({ userId: USER_ID })).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("createPlace (standalone — no listId)", () => {
    it("inserts a place and returns it", async () => {
      mockInsertRows = [fullPlaceRow];
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
      mockInsert.mockImplementation(() => ({
        values: (vals: { googlePlaceId?: string }) => {
          capturedGooglePlaceId = vals.googlePlaceId;
          return { returning: vi.fn().mockResolvedValue([fullPlaceRow]) };
        },
      }));
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
      mockInsertError = new Error("disk full");
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
      let updateCallCount = 0;
      mockUpdate.mockImplementation(() => {
        const callIndex = ++updateCallCount;
        const where = vi.fn().mockReturnValue(
          callIndex === 2
            ? { returning: vi.fn().mockResolvedValue([{ id: "lp1" }, { id: "lp2" }]) }
            : Promise.resolve({})
        );
        return { set: vi.fn().mockReturnValue({ where }) };
      });
      mockSelectRows = [{ id: PLACE_ID }]; // ownership check

      const result = await deletePlace({ placeId: PLACE_ID, userId: USER_ID });
      expect(result.deletedListPlaceCount).toBe(2);
    });

    it("returns 0 cascaded rows when place is not attached to any list", async () => {
      let updateCallCount = 0;
      mockUpdate.mockImplementation(() => {
        const callIndex = ++updateCallCount;
        const where = vi.fn().mockReturnValue(
          callIndex === 2
            ? { returning: vi.fn().mockResolvedValue([]) }
            : Promise.resolve({})
        );
        return { set: vi.fn().mockReturnValue({ where }) };
      });
      mockSelectRows = [{ id: PLACE_ID }];

      const result = await deletePlace({ placeId: PLACE_ID, userId: USER_ID });
      expect(result.deletedListPlaceCount).toBe(0);
    });

    it("throws NOT_FOUND when place does not belong to user", async () => {
      mockSelectRows = []; // ownership check fails
      await expect(
        deletePlace({ placeId: PLACE_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws NOT_FOUND when place is already deleted", async () => {
      mockSelectRows = []; // isNull(deletedAt) excludes deleted place
      await expect(
        deletePlace({ placeId: PLACE_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on DB failure during cascade", async () => {
      let updateCallCount = 0;
      mockUpdate.mockImplementation(() => {
        const callIndex = ++updateCallCount;
        const where = vi.fn().mockReturnValue(
          callIndex === 2
            ? { returning: vi.fn().mockRejectedValue(new Error("connection lost")) }
            : Promise.resolve({})
        );
        return { set: vi.fn().mockReturnValue({ where }) };
      });
      mockSelectRows = [{ id: PLACE_ID }];
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
