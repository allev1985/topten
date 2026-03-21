/**
 * Redis-backed implementation of the CacheStore interface.
 * @module lib/services/cache/redis-store
 */

import Redis from "ioredis";
import type { CacheStore } from "./types";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("redis-store");

/**
 * CacheStore implementation backed by ioredis.
 */
export class RedisStore implements CacheStore {
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.client.on("error", (err) => {
      log.warn({ method: "RedisStore", err }, "Redis connection error");
    });

    this.client.on("connect", () => {
      log.info({ method: "RedisStore" }, "Connected to Redis");
    });

    // Connect eagerly but don't block construction
    this.client.connect().catch((err) => {
      log.warn(
        { method: "RedisStore", err },
        "Initial Redis connection failed"
      );
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
