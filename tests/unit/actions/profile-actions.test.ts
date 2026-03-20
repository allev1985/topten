import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateNameAction, updateSlugAction } from "@/actions/profile-actions";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/headers (required by @/lib/supabase/server transitively)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [{ name: "session", value: "mock-session-value" }],
    })
  ),
}));

// Mock auth service
vi.mock("@/lib/auth/service");

// Build a fluent Drizzle mock
let mockDbSelectResult: unknown[] = [];
let mockDbUpdateError: unknown = null;

const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockThen = vi.fn();
const mockSet = vi.fn();
const mockFrom = vi.fn();

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

// Import after mocking
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const mockGetSession = vi.mocked(getSession);
const mockRevalidatePath = vi.mocked(revalidatePath);

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const authenticatedSession = {
  authenticated: true as const,
  user: { id: "user-123", email: "test@example.com" },
  session: { expiresAt: null, isExpiringSoon: false },
};

const unauthenticatedSession = {
  authenticated: false as const,
  user: null,
  session: null,
};

describe("Profile Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelectResult = [];
    mockDbUpdateError = null;

    // Setup fluent select chain: db.select().from().where().limit().then()
    mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
      Promise.resolve(cb(mockDbSelectResult))
    );
    mockLimit.mockReturnValue({ then: mockThen });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    // Setup fluent update chain: db.update().set().where()
    const updateWhere = vi.fn().mockImplementation(() => {
      if (mockDbUpdateError) return Promise.reject(mockDbUpdateError);
      return Promise.resolve();
    });
    mockSet.mockReturnValue({ where: updateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  });

  // ---------------------------------------------------------------------------
  // updateNameAction
  // ---------------------------------------------------------------------------

  describe("updateNameAction", () => {
    describe("User Story 2 — Update Display Name", () => {
      it("returns auth error when unauthenticated", async () => {
        mockGetSession.mockResolvedValue(unauthenticatedSession);

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "Alice" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
          "You must be logged in to update your profile"
        );
        expect(result.fieldErrors).toEqual({});
      });

      it("returns field error for empty name", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBeNull();
        expect(result.fieldErrors.name).toBeDefined();
        expect(result.fieldErrors.name?.[0]).toBe("Name is required");
      });

      it("returns field error for name exceeding 255 characters", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "a".repeat(256) })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.name).toBeDefined();
        expect(result.fieldErrors.name?.[0]).toBe("Name is too long");
      });

      it("saves name and returns success data", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "Alice Smith" })
        );

        expect(result.isSuccess).toBe(true);
        expect(result.error).toBeNull();
        expect(result.fieldErrors).toEqual({});
        expect(result.data?.name).toBe("Alice Smith");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings");
      });

      it("trims whitespace from name before saving", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "  Alice  " })
        );

        expect(result.isSuccess).toBe(true);
        expect(result.data?.name).toBe("Alice");
      });

      it("returns generic error on DB write failure", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);
        mockDbUpdateError = new Error("DB connection failed");

        const result = await updateNameAction(
          initialState,
          createFormData({ name: "Alice" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Failed to update name. Please try again.");
        expect(result.fieldErrors).toEqual({});
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateSlugAction
  // ---------------------------------------------------------------------------

  describe("updateSlugAction", () => {
    describe("User Story 1 — Update Vanity Slug", () => {
      it("returns auth error when unauthenticated", async () => {
        mockGetSession.mockResolvedValue(unauthenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "newslug" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
          "You must be logged in to update your profile"
        );
      });

      it("returns field error for empty slug", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBeNull();
        expect(result.fieldErrors.vanitySlug).toBeDefined();
        // First error is "Profile URL is required"
        expect(result.fieldErrors.vanitySlug?.[0]).toBe(
          "Profile URL is required"
        );
      });

      it("returns field error for single character slug (too short)", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "a" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.vanitySlug).toBeDefined();
      });

      it("returns field error for invalid characters in slug", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "My Slug!" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.vanitySlug).toBeDefined();
      });

      it("returns field error when slug starts with a hyphen", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "-badslug" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.vanitySlug).toBeDefined();
      });

      it("returns field error for slug exceeding 50 characters", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "a".repeat(51) })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.vanitySlug).toBeDefined();
      });

      it("saves valid slug and returns success data", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);
        // No existing slug for another user — empty result
        mockDbSelectResult = [];

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "newslug" })
        );

        expect(result.isSuccess).toBe(true);
        expect(result.error).toBeNull();
        expect(result.fieldErrors).toEqual({});
        expect(result.data?.vanitySlug).toBe("newslug");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings");
      });

      it("own unchanged slug is not a conflict (no-self-conflict)", async () => {
        // The query excludes the current user's ID, so no rows => no conflict
        mockGetSession.mockResolvedValue(authenticatedSession);
        mockDbSelectResult = [];

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "myslug" })
        );

        expect(result.isSuccess).toBe(true);
        expect(result.data?.vanitySlug).toBe("myslug");
      });

      it("returns slug-taken field error when slug is taken by another user (Layer 1 pre-check)", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);
        // Layer 1 pre-check finds an existing row for another user
        mockDbSelectResult = [{ id: "other-user-456" }];

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "takenslug" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBeNull();
        expect(result.fieldErrors.vanitySlug?.[0]).toBe(
          "This URL is already taken. Please choose a different one."
        );
      });

      it("returns slug-taken field error on race-condition DB 23505 error (Layer 2)", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);
        // Layer 1 passes (no pre-existing row)
        mockDbSelectResult = [];
        // Layer 2 DB write throws a unique constraint violation
        mockDbUpdateError = { code: "23505", message: "unique_violation" };

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "raceslug" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.fieldErrors.vanitySlug?.[0]).toBe(
          "This URL is already taken. Please choose a different one."
        );
      });

      it("returns generic error on non-unique DB write failure", async () => {
        mockGetSession.mockResolvedValue(authenticatedSession);
        mockDbSelectResult = [];
        mockDbUpdateError = new Error("DB connection failed");

        const result = await updateSlugAction(
          initialState,
          createFormData({ vanitySlug: "newslug" })
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
          "Failed to update profile URL. Please try again."
        );
        expect(result.fieldErrors).toEqual({});
      });
    });
  });
});
