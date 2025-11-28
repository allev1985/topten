import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/ssr before importing the module under test
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/client";

describe("Browser Supabase Client", () => {
  const mockSupabaseUrl = "https://test.supabase.co";
  const mockAnonKey = "test-anon-key";

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockAnonKey;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("should call createBrowserClient with correct environment variables", () => {
    const mockClient = { auth: {} };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as ReturnType<typeof createBrowserClient>);

    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      mockSupabaseUrl,
      mockAnonKey
    );
  });

  it("should return a valid Supabase client instance", () => {
    const mockClient = { auth: { signIn: vi.fn() } };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as ReturnType<typeof createBrowserClient>);

    const result = createClient();

    expect(result).toBe(mockClient);
  });

  it("should call createBrowserClient only once per call", () => {
    const mockClient = { auth: {} };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as ReturnType<typeof createBrowserClient>);

    createClient();
    createClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(2);
  });
});
