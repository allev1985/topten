import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGet, mockSet, mockDel } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
}));

vi.mock("@/lib/services/cache", () => ({
  cacheStore: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { cachedQuery, invalidateCache } from "@/lib/services/cache/helpers";

describe("cachedQuery", () => {
  const fetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached value on cache hit", async () => {
    mockGet.mockResolvedValue(JSON.stringify({ id: "1", name: "Test" }));

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toEqual({ id: "1", name: "Test" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("calls fetcher and caches result on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);
    fetcher.mockResolvedValue({ id: "2", name: "Fresh" });

    const result = await cachedQuery("key", 600, fetcher);

    expect(result).toEqual({ id: "2", name: "Fresh" });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      "key",
      JSON.stringify({ id: "2", name: "Fresh" }),
      600
    );
  });

  it("does not cache null fetcher results", async () => {
    mockGet.mockResolvedValue(null);
    fetcher.mockResolvedValue(null);

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toBeNull();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("falls back to fetcher when cache read fails", async () => {
    mockGet.mockRejectedValue(new Error("Redis down"));
    mockSet.mockResolvedValue(undefined);
    fetcher.mockResolvedValue([{ id: "3" }]);

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toEqual([{ id: "3" }]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns fetcher result when cache write fails", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockRejectedValue(new Error("Redis down"));
    fetcher.mockResolvedValue({ id: "4" });

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toEqual({ id: "4" });
  });

  it("propagates fetcher errors", async () => {
    mockGet.mockResolvedValue(null);
    fetcher.mockRejectedValue(new Error("DB error"));

    await expect(cachedQuery("key", 300, fetcher)).rejects.toThrow("DB error");
  });

  it("caches arrays", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);
    fetcher.mockResolvedValue([1, 2, 3]);

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toEqual([1, 2, 3]);
    expect(mockSet).toHaveBeenCalledWith("key", "[1,2,3]", 300);
  });

  it("caches empty arrays", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);
    fetcher.mockResolvedValue([]);

    const result = await cachedQuery("key", 300, fetcher);

    expect(result).toEqual([]);
    expect(mockSet).toHaveBeenCalledWith("key", "[]", 300);
  });
});

describe("invalidateCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a single key", async () => {
    mockDel.mockResolvedValue(undefined);

    await invalidateCache("key1");

    expect(mockDel).toHaveBeenCalledWith("key1");
  });

  it("deletes multiple keys", async () => {
    mockDel.mockResolvedValue(undefined);

    await invalidateCache("key1", "key2", "key3");

    expect(mockDel).toHaveBeenCalledTimes(3);
    expect(mockDel).toHaveBeenCalledWith("key1");
    expect(mockDel).toHaveBeenCalledWith("key2");
    expect(mockDel).toHaveBeenCalledWith("key3");
  });

  it("does not throw when deletion fails", async () => {
    mockDel.mockRejectedValue(new Error("Redis down"));

    await expect(invalidateCache("key1")).resolves.toBeUndefined();
  });

  it("continues deleting remaining keys when one fails", async () => {
    mockDel
      .mockRejectedValueOnce(new Error("Redis down"))
      .mockResolvedValueOnce(undefined);

    await invalidateCache("key1", "key2");

    expect(mockDel).toHaveBeenCalledTimes(2);
  });
});
