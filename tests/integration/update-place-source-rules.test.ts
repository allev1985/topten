/**
 * Integration tests for Google Places immutability rules.
 *
 * Validates that updatePlace only mutates description and that TypeScript
 * enforces this at compile-time; runtime tests confirm the service rejects
 * invalid ownership and returns the correct shaped record.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePlace } from "@/lib/place/service";

// ─── DB mock ──────────────────────────────────────────────────────────────────

let mockSelectRows: unknown[] = [];
let mockUpdateRows: unknown[] = [];
let mockUpdateError: unknown = null;

const { mockSelect, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
  },
}));

function makeThenableChain(
  resolveWith: () => unknown
): Record<string, unknown> {
  const asPromise = () => Promise.resolve(resolveWith());
  const node: Record<string, unknown> = {
    then: (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown
    ) => asPromise().then(onFulfilled, onRejected),
    catch: (onRejected?: (e: unknown) => unknown) =>
      asPromise().catch(onRejected),
    finally: (onFinally?: () => void) => asPromise().finally(onFinally),
    where: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    returning: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    groupBy: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    innerJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    leftJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
  };
  return node;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc";
const PLACE_ID = "place-xyz";
const LIST_ID = "list-123";
const NOW = new Date("2024-06-01T00:00:00Z");

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectRows = [];
  mockUpdateRows = [];
  mockUpdateError = null;

  mockSelect.mockImplementation(() => ({
    from: vi.fn(() => makeThenableChain(() => Promise.resolve(mockSelectRows))),
  }));

  const mockReturning = vi.fn().mockImplementation(() => {
    if (mockUpdateError) return Promise.reject(mockUpdateError);
    return Promise.resolve(mockUpdateRows);
  });
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("updatePlace — description-only mutability rules", () => {
  it("successfully updates description and returns id + description + updatedAt", async () => {
    mockSelectRows = [{ placeId: PLACE_ID }]; // ownership check passes
    mockUpdateRows = [
      { id: PLACE_ID, description: "Lovely coffee shop", updatedAt: NOW },
    ];

    const result = await updatePlace({
      placeId: PLACE_ID,
      listId: LIST_ID,
      userId: USER_ID,
      description: "Lovely coffee shop",
    });

    expect(result.place.id).toBe(PLACE_ID);
    expect(result.place.description).toBe("Lovely coffee shop");
    expect(result.place.updatedAt).toEqual(NOW);
  });

  it("permits clearing description by passing null", async () => {
    mockSelectRows = [{ placeId: PLACE_ID }];
    mockUpdateRows = [{ id: PLACE_ID, description: null, updatedAt: NOW }];

    const result = await updatePlace({
      placeId: PLACE_ID,
      userId: USER_ID,
      description: null,
    });

    expect(result.place.description).toBeNull();
  });

  it("permits omitting description (no-op update)", async () => {
    mockSelectRows = [{ placeId: PLACE_ID }];
    mockUpdateRows = [
      { id: PLACE_ID, description: "Old notes", updatedAt: NOW },
    ];

    const result = await updatePlace({
      placeId: PLACE_ID,
      userId: USER_ID,
    });

    expect(result.place).toBeDefined();
  });

  it("throws NOT_FOUND when ownership check fails", async () => {
    mockSelectRows = []; // ownership check returns nothing

    await expect(
      updatePlace({
        placeId: PLACE_ID,
        listId: LIST_ID,
        userId: USER_ID,
        description: "New notes",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND when DB update returns no rows", async () => {
    mockSelectRows = [{ placeId: PLACE_ID }];
    mockUpdateRows = []; // place was deleted between ownership check and update

    await expect(
      updatePlace({
        placeId: PLACE_ID,
        userId: USER_ID,
        description: "Notes",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it.each([
    "name",
    "address",
    "googlePlaceId",
    "latitude",
    "longitude",
    "heroImageUrl",
  ])(
    'throws IMMUTABLE_FIELD with field name when "%s" is passed at runtime',
    async (field) => {
      await expect(
        updatePlace({
          placeId: PLACE_ID,
          userId: USER_ID,
          [field]: "any",
        } as Parameters<typeof updatePlace>[0])
      ).rejects.toMatchObject({
        code: "IMMUTABLE_FIELD",
        message: expect.stringContaining(field),
      });
    }
  );

  it("immutability is enforced by TypeScript — name/address/googlePlaceId not in parameter type", () => {
    // Compile-time contract verification
    type UpdatePlaceParams = Parameters<typeof updatePlace>[0];
    type HasName = "name" extends keyof UpdatePlaceParams ? true : false;
    type HasAddress = "address" extends keyof UpdatePlaceParams ? true : false;
    type HasGooglePlaceId = "googlePlaceId" extends keyof UpdatePlaceParams
      ? true
      : false;
    type HasHeroImageUrl = "heroImageUrl" extends keyof UpdatePlaceParams
      ? true
      : false;

    const noName: HasName = false;
    const noAddress: HasAddress = false;
    const noGooglePlaceId: HasGooglePlaceId = false;
    const noHeroImageUrl: HasHeroImageUrl = false;

    expect(noName).toBe(false);
    expect(noAddress).toBe(false);
    expect(noGooglePlaceId).toBe(false);
    expect(noHeroImageUrl).toBe(false);
  });
});
