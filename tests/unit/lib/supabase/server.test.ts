import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/ssr before importing the module under test
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

describe("Server Supabase Client", () => {
  // Shared mock values
  const mockSupabaseUrl = "https://test.supabase.co";
  const mockAnonKey = "test-anon-key";

  // Shared mock objects
  const mockCookieStore = {
    getAll: vi.fn().mockReturnValue([{ name: "sb-token", value: "token123" }]),
    set: vi.fn(),
  };

  const mockClient = { auth: { getUser: vi.fn() } };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockAnonKey;
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    vi.mocked(createServerClient).mockReturnValue(mockClient as ReturnType<typeof createServerClient>);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("should call createServerClient with correct environment variables", async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      mockSupabaseUrl,
      mockAnonKey,
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it("should return a valid Supabase client instance", async () => {
    const result = await createClient();

    expect(result).toBe(mockClient);
  });

  it("should configure cookie handlers with getAll method", async () => {
    await createClient();

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    expect(cookieConfig).toBeDefined();
    expect(cookieConfig?.getAll).toBeDefined();
    
    // Verify that the getAll function was provided
    expect(typeof cookieConfig?.getAll).toBe("function");
  });

  it("should configure cookie handlers with setAll method", async () => {
    await createClient();

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    expect(cookieConfig).toBeDefined();
    
    // Test that setAll function works
    const cookiesToSet = [
      { name: "test-cookie", value: "test-value", options: { path: "/" } },
    ];
    cookieConfig?.setAll?.(cookiesToSet);
    expect(mockCookieStore.set).toHaveBeenCalledWith("test-cookie", "test-value", { path: "/" });
  });

  it("should handle setAll errors gracefully from Server Components", async () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error("Cannot set cookies in Server Component");
    });

    await createClient();

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    
    // setAll should not throw even if set fails
    const cookiesToSet = [
      { name: "test-cookie", value: "test-value", options: {} },
    ];
    expect(() => cookieConfig?.setAll?.(cookiesToSet)).not.toThrow();
  });
});
