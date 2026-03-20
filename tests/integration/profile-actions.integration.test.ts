/**
 * Integration tests for profile-actions (slug uniqueness)
 *
 * Tests complete update workflows with realistic DB mocks to validate
 * end-to-end behaviour of the two-layer slug uniqueness defence.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSlugAction, updateNameAction } from "@/actions/profile-actions";

// Mock next/cache
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Mock next/headers (transitively needed by supabase server client)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [{ name: "session", value: "mock-session-value" }],
    })
  ),
}));

// Mock auth service
vi.mock("@/lib/auth/service");

// -------------------------------------------------------
// Realistic DB mock — builds enough of the Drizzle fluent
// interface to exercise the profile-actions queries.
// -------------------------------------------------------

let mockSelectWhereCb: () => Promise<unknown[]> = async () => [];
let mockUpdateError: unknown = null;

vi.mock("@/db", () => {
  return {
    db: {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi
                .fn()
                .mockImplementation((cb: (rows: unknown[]) => unknown) =>
                  mockSelectWhereCb().then(cb)
                ),
            }),
          }),
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (mockUpdateError) return Promise.reject(mockUpdateError);
            return Promise.resolve();
          }),
        }),
      })),
    },
  };
});

import { getSession } from "@/lib/auth";

const mockGetSession = vi.mocked(getSession);

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const session = {
  authenticated: true as const,
  user: { id: "current-user-id", email: "me@example.com" },
  session: { expiresAt: null, isExpiringSoon: false },
};

describe("Profile Actions Integration — Slug Uniqueness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhereCb = async () => []; // default: no conflicting rows
    mockUpdateError = null;
    mockGetSession.mockResolvedValue(session);
  });

  it("saves a unique slug end-to-end and returns success", async () => {
    mockSelectWhereCb = async () => []; // no duplicate

    const result = await updateSlugAction(
      initialState,
      createFormData({ vanitySlug: "unique-handle" })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.vanitySlug).toBe("unique-handle");
    expect(result.error).toBeNull();
    expect(result.fieldErrors).toEqual({});
  });

  it("returns slug-taken field error when application pre-check finds a duplicate", async () => {
    mockSelectWhereCb = async () => [{ id: "other-user-id" }];

    const result = await updateSlugAction(
      initialState,
      createFormData({ vanitySlug: "popular-slug" })
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeNull();
    expect(result.fieldErrors.vanitySlug?.[0]).toBe(
      "This URL is already taken. Please choose a different one."
    );
  });

  it("returns slug-taken error on race-condition DB unique violation (23505)", async () => {
    mockSelectWhereCb = async () => []; // Layer 1 passes
    mockUpdateError = {
      code: "23505",
      detail: "Key (vanity_slug)=(race-slug) already exists.",
    };

    const result = await updateSlugAction(
      initialState,
      createFormData({ vanitySlug: "race-slug" })
    );

    expect(result.isSuccess).toBe(false);
    expect(result.fieldErrors.vanitySlug?.[0]).toBe(
      "This URL is already taken. Please choose a different one."
    );
  });

  it("own-slug no-conflict — current user can re-save same slug", async () => {
    // The query excludes the current user (ne(users.id, currentUserId))
    // so even if this were the user's own slug, no rows would match.
    mockSelectWhereCb = async () => []; // simulates own-slug excluded from query

    const result = await updateSlugAction(
      initialState,
      createFormData({ vanitySlug: "my-own-slug" })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.vanitySlug).toBe("my-own-slug");
  });
});

describe("Profile Actions Integration — Name Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhereCb = async () => [];
    mockUpdateError = null;
    mockGetSession.mockResolvedValue(session);
  });

  it("saves a valid name end-to-end and returns success", async () => {
    const result = await updateNameAction(
      initialState,
      createFormData({ name: "Alice Johnson" })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.name).toBe("Alice Johnson");
  });

  it("returns auth error when unauthenticated", async () => {
    mockGetSession.mockResolvedValue({
      authenticated: false as const,
      user: null,
      session: null,
    });

    const result = await updateNameAction(
      initialState,
      createFormData({ name: "Alice" })
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe("You must be logged in to update your profile");
  });
});
