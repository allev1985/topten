/**
 * Integration tests for updatePlaceAction — description clearing behaviour.
 *
 * Verifies that an empty or whitespace-only textarea value is mapped to null
 * (clearing the description) rather than undefined (a no-op), so users can
 * remove notes via the UI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePlaceAction } from "@/actions/place-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/utils/actions", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "user-123", email: "user@example.com" }),
}));

const mockUpdatePlace = vi.fn();
vi.mock("@/lib/place/service", () => ({
  updatePlace: (...args: unknown[]) => mockUpdatePlace(...args),
}));

const INITIAL_STATE = { data: null, error: null, fieldErrors: {}, isSuccess: false } as const;

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdatePlace.mockResolvedValue({ place: { id: "place-1", description: null, updatedAt: new Date() } });
});

describe("updatePlaceAction — description clearing", () => {
  it("passes null to updatePlace when description textarea is empty", async () => {
    await updatePlaceAction(INITIAL_STATE, makeFormData({ placeId: "place-1", description: "" }));
    expect(mockUpdatePlace).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
  });

  it("passes null to updatePlace when description is whitespace only", async () => {
    await updatePlaceAction(INITIAL_STATE, makeFormData({ placeId: "place-1", description: "   " }));
    expect(mockUpdatePlace).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
  });

  it("passes the trimmed string to updatePlace when description has content", async () => {
    await updatePlaceAction(INITIAL_STATE, makeFormData({ placeId: "place-1", description: "  Great spot  " }));
    expect(mockUpdatePlace).toHaveBeenCalledWith(expect.objectContaining({ description: "Great spot" }));
  });

  it("passes undefined to updatePlace when description field is absent from form", async () => {
    await updatePlaceAction(INITIAL_STATE, makeFormData({ placeId: "place-1" }));
    expect(mockUpdatePlace).toHaveBeenCalledWith(expect.objectContaining({ description: undefined }));
  });
});
