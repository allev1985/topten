/**
 * Redis-backed implementation of the CacheStore interface.
 * @module lib/services/cache/redis-store
 */

import Redis from "ioredis";
import type { CacheStore } from "./types";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("redis-store");

export class RedisStore implements CacheStore {
  private readonly client: Redis;

  /**
   * Create a RedisStore that connects to the given Redis URL.
   * @param redisUrl - Redis connection string (e.g. `redis://localhost:6379`)
   */
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
      log.debug({ method: "RedisStore" }, "Connected to Redis");
    });

    // Connect eagerly but don't block construction
    this.client.connect().catch((err) => {
      log.warn(
        { method: "RedisStore", err },
        "Initial Redis connection failed"
      );
    });
  }

  /**
   * @param key - Cache key to look up
   * @returns The stored value, or null on miss
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * @param key - Cache key
   * @param value - String value to store
   * @param ttlSeconds - Time-to-live in seconds
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  /**
   * @param key - Cache key to increment
   * @returns The new integer value after incrementing
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * @param key - Cache key to set expiry on
   * @param ttlSeconds - Time-to-live in seconds
   * @returns `true` if the key exists and the TTL was set
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  /**
   * @param key - Cache key to check
   * @returns Remaining TTL in seconds, -1 if no TTL, -2 if key does not exist
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Execute a Lua script atomically.
   * @param script - Lua script source
   * @param keys - KEYS array passed to the script
   * @param args - ARGV array passed to the script
   * @returns The value returned by the Lua script
   */
  async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }
}
