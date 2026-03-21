import { describe, it, expect, vi } from "vitest";

// Mock ioredis and config before importing
vi.mock("ioredis", () => ({
  default: class MockRedis {
    get = vi.fn();
    set = vi.fn();
    incr = vi.fn();
    del = vi.fn();
    expire = vi.fn();
    ttl = vi.fn();
    on = vi.fn();
    connect = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@/lib/config", () => ({
  config: {
    cache: { redisUrl: "redis://localhost:6379" },
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

import { cacheStore, createCacheStore } from "@/lib/services/cache";
import { RedisStore } from "@/lib/services/cache/redis-store";

describe("cache index", () => {
  it("createCacheStore returns a RedisStore instance", () => {
    const store = createCacheStore();

    expect(store).toBeInstanceOf(RedisStore);
  });

  it("exports a singleton cacheStore that is a RedisStore", () => {
    expect(cacheStore).toBeInstanceOf(RedisStore);
  });
});
