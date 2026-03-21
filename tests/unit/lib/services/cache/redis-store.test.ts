import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisStore } from "@/lib/services/cache/redis-store";

// Mock ioredis with a class implementation
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockIncr = vi.fn();
const mockDel = vi.fn();
const mockExpire = vi.fn();
const mockTtl = vi.fn();
const mockOn = vi.fn();
const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock("ioredis", () => ({
  default: class MockRedis {
    get = mockGet;
    set = mockSet;
    incr = mockIncr;
    del = mockDel;
    expire = mockExpire;
    ttl = mockTtl;
    on = mockOn;
    connect = mockConnect;
  },
}));

// Mock logging
vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("RedisStore", () => {
  let store: RedisStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    store = new RedisStore("redis://localhost:6379");
  });

  describe("constructor", () => {
    it("registers error and connect event handlers", () => {
      expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith("connect", expect.any(Function));
    });

    it("calls connect eagerly", () => {
      expect(mockConnect).toHaveBeenCalledOnce();
    });
  });

  describe("get", () => {
    it("returns the value for an existing key", async () => {
      mockGet.mockResolvedValue("bar");

      const result = await store.get("foo");

      expect(result).toBe("bar");
      expect(mockGet).toHaveBeenCalledWith("foo");
    });

    it("returns null for a missing key", async () => {
      mockGet.mockResolvedValue(null);

      const result = await store.get("missing");

      expect(result).toBeNull();
    });

    it("propagates Redis errors", async () => {
      mockGet.mockRejectedValue(new Error("connection lost"));

      await expect(store.get("foo")).rejects.toThrow("connection lost");
    });
  });

  describe("set", () => {
    it("sets a value with EX TTL", async () => {
      mockSet.mockResolvedValue("OK");

      await store.set("key", "value", 300);

      expect(mockSet).toHaveBeenCalledWith("key", "value", "EX", 300);
    });

    it("propagates Redis errors", async () => {
      mockSet.mockRejectedValue(new Error("connection lost"));

      await expect(store.set("key", "value", 60)).rejects.toThrow(
        "connection lost"
      );
    });
  });

  describe("incr", () => {
    it("returns the incremented value", async () => {
      mockIncr.mockResolvedValue(5);

      const result = await store.incr("counter");

      expect(result).toBe(5);
      expect(mockIncr).toHaveBeenCalledWith("counter");
    });

    it("returns 1 for a new key", async () => {
      mockIncr.mockResolvedValue(1);

      const result = await store.incr("new-counter");

      expect(result).toBe(1);
    });
  });

  describe("del", () => {
    it("deletes the key", async () => {
      mockDel.mockResolvedValue(1);

      await store.del("key");

      expect(mockDel).toHaveBeenCalledWith("key");
    });

    it("does not throw when key does not exist", async () => {
      mockDel.mockResolvedValue(0);

      await expect(store.del("missing")).resolves.toBeUndefined();
    });
  });

  describe("expire", () => {
    it("returns true when key exists", async () => {
      mockExpire.mockResolvedValue(1);

      const result = await store.expire("key", 120);

      expect(result).toBe(true);
      expect(mockExpire).toHaveBeenCalledWith("key", 120);
    });

    it("returns false when key does not exist", async () => {
      mockExpire.mockResolvedValue(0);

      const result = await store.expire("missing", 120);

      expect(result).toBe(false);
    });
  });

  describe("ttl", () => {
    it("returns the remaining TTL in seconds", async () => {
      mockTtl.mockResolvedValue(42);

      const result = await store.ttl("key");

      expect(result).toBe(42);
      expect(mockTtl).toHaveBeenCalledWith("key");
    });

    it("returns -2 when key does not exist", async () => {
      mockTtl.mockResolvedValue(-2);

      const result = await store.ttl("missing");

      expect(result).toBe(-2);
    });

    it("returns -1 when key has no TTL", async () => {
      mockTtl.mockResolvedValue(-1);

      const result = await store.ttl("persistent");

      expect(result).toBe(-1);
    });
  });
});
