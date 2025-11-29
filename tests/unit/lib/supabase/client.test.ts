import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/ssr before importing the module under test
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/client";

describe("Browser Supabase Client", () => {
  // Shared mock values
  const mockSupabaseUrl = "https://test.supabase.co";
  const mockAnonKey = "test-anon-key";

  // Shared mock objects
  const mockClient = { auth: { signIn: vi.fn() } };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockAnonKey;
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as ReturnType<typeof createBrowserClient>);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("should call createBrowserClient with correct environment variables", () => {
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      mockSupabaseUrl,
      mockAnonKey
    );
  });

  it("should return a valid Supabase client instance", () => {
    const result = createClient();

    expect(result).toBe(mockClient);
  });

  it("should call createBrowserClient only once per call", () => {
    createClient();
    createClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(2);
  });
});
