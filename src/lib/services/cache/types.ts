/**
 * Types for the cache service.
 * @module lib/services/cache/types
 */

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<void>;
  expire(key: string, ttlSeconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  eval(script: string, keys: string[], args: string[]): Promise<unknown>;
}

export type CacheServiceErrorCode =
  | "CONNECTION_ERROR"
  | "TIMEOUT"
  | "CONFIGURATION_ERROR";
