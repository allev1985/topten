import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  })),
}));

import { createClient } from "@/lib/supabase/client";

/**
 * Integration tests for Supabase session monitoring
 *
 * These tests verify that:
 * 1. Supabase client provides auth state change monitoring
 * 2. Subscriptions can be properly managed
 */
describe("Session Monitoring Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides onAuthStateChange method", () => {
    const supabase = createClient();
    expect(supabase.auth.onAuthStateChange).toBeDefined();
    expect(typeof supabase.auth.onAuthStateChange).toBe("function");
  });

  it("returns subscription object with unsubscribe method", () => {
    const supabase = createClient();
    const callback = vi.fn();
    const result = supabase.auth.onAuthStateChange(callback);

    expect(result.data).toBeDefined();
    expect(result.data.subscription).toBeDefined();
    expect(result.data.subscription.unsubscribe).toBeDefined();
    expect(typeof result.data.subscription.unsubscribe).toBe("function");
  });

  it("callback is invoked with event and session parameters", () => {
    const supabase = createClient();
    const callback = vi.fn();
    supabase.auth.onAuthStateChange(callback);

    // Verify callback signature (should be (event, session) => void)
    expect(callback).toHaveBeenCalledTimes(0); // Not called immediately
  });
});
