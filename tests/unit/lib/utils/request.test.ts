import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClientIP } from "@/lib/utils/request";

const mockHeaders = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => mockHeaders.get(key) ?? null,
  }),
}));

describe("getClientIP", () => {
  beforeEach(() => {
    mockHeaders.clear();
  });

  it("extracts IP from x-forwarded-for (single value)", async () => {
    mockHeaders.set("x-forwarded-for", "1.2.3.4");

    expect(await getClientIP()).toBe("1.2.3.4");
  });

  it("extracts first IP from x-forwarded-for (multiple values)", async () => {
    mockHeaders.set("x-forwarded-for", "1.2.3.4, 10.0.0.1, 192.168.1.1");

    expect(await getClientIP()).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for", async () => {
    mockHeaders.set("x-forwarded-for", "  1.2.3.4  , 10.0.0.1");

    expect(await getClientIP()).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    mockHeaders.set("x-real-ip", "5.6.7.8");

    expect(await getClientIP()).toBe("5.6.7.8");
  });

  it("prefers x-forwarded-for over x-real-ip", async () => {
    mockHeaders.set("x-forwarded-for", "1.2.3.4");
    mockHeaders.set("x-real-ip", "5.6.7.8");

    expect(await getClientIP()).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no IP headers are present", async () => {
    expect(await getClientIP()).toBe("unknown");
  });
});
