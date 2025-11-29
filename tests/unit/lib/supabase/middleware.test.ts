import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/ssr before importing the module under test
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

// Mock next/server
vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(),
  },
}));

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

describe("Middleware Supabase Helper", () => {
  // Shared mock values
  const mockSupabaseUrl = "https://test.supabase.co";
  const mockAnonKey = "test-anon-key";
  
  // Shared mock objects
  const mockRequestCookies = {
    getAll: vi.fn().mockReturnValue([{ name: "sb-token", value: "token123" }]),
    set: vi.fn(),
  };

  const mockResponseCookies = {
    set: vi.fn(),
  };

  const mockRequest = {
    cookies: mockRequestCookies,
  } as unknown as NextRequest;

  const mockResponse = {
    cookies: mockResponseCookies,
  };

  const mockGetUser = vi.fn();
  const mockClient = { auth: { getUser: mockGetUser } };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockAnonKey;
    vi.mocked(NextResponse.next).mockReturnValue(mockResponse as unknown as ReturnType<typeof NextResponse.next>);
    mockGetUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(createServerClient).mockReturnValue(mockClient as ReturnType<typeof createServerClient>);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("should call createServerClient with correct environment variables", async () => {
    await updateSession(mockRequest);

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

  it("should call supabase.auth.getUser() for session refresh", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "123" } } });

    await updateSession(mockRequest);

    expect(mockGetUser).toHaveBeenCalled();
  });

  it("should return a NextResponse", async () => {
    const result = await updateSession(mockRequest);

    expect(result).toBe(mockResponse);
  });

  it("should use getAll cookie pattern from request", async () => {
    await updateSession(mockRequest);

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    expect(cookieConfig).toBeDefined();
    
    // Verify that getAll function is provided
    expect(typeof cookieConfig?.getAll).toBe("function");
  });

  it("should use setAll cookie pattern to set cookies on request and response", async () => {
    await updateSession(mockRequest);

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    expect(cookieConfig).toBeDefined();
    
    // Test that setAll sets cookies on both request and response
    const cookiesToSet = [
      { name: "new-cookie", value: "new-value", options: { path: "/" } },
    ];
    cookieConfig?.setAll?.(cookiesToSet);
    
    // Should set on request cookies
    expect(mockRequestCookies.set).toHaveBeenCalledWith("new-cookie", "new-value");
    // Should set on response cookies
    expect(mockResponseCookies.set).toHaveBeenCalledWith("new-cookie", "new-value", { path: "/" });
  });

  it("should create a new NextResponse when setAll is called", async () => {
    await updateSession(mockRequest);

    // Get the cookie configuration passed to createServerClient
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieConfig = callArgs?.[2]?.cookies;
    
    // Reset the mock count before calling setAll
    const callsBefore = vi.mocked(NextResponse.next).mock.calls.length;
    
    const cookiesToSet = [
      { name: "test", value: "value", options: {} },
    ];
    cookieConfig?.setAll?.(cookiesToSet);
    
    // NextResponse.next should be called again when setAll is called
    expect(vi.mocked(NextResponse.next).mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
