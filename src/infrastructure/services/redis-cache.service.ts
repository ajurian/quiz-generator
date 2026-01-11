import { Redis } from "@upstash/redis";
import type { ICacheService } from "@/application";

/**
 * Redis Cache Service using Upstash Redis
 *
 * Implements the ICacheService port using Upstash Redis for caching.
 * Supports TTL-based expiration and pattern-based invalidation.
 */
export class RedisCacheService implements ICacheService {
  private readonly redis: Redis;

  constructor(options: { url: string; token: string }) {
    if (!options.url || !options.token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required"
      );
    }

    this.redis = new Redis({
      url: options.url,
      token: options.token,
    });
  }

  /**
   * Gets a cached value by key
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get<T>(key);
    return value ?? null;
  }

  /**
   * Sets a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  /**
   * Invalidates cache entries matching a pattern
   * @param pattern Pattern to match (e.g., "quiz:*")
   */
  async invalidate(pattern: string): Promise<void> {
    // Upstash Redis supports SCAN for pattern matching
    let cursor: string = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }

  /**
   * Deletes a specific cache entry
   * @param key Cache key to delete
   */
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Checks if a key exists in cache
   * @param key Cache key
   * @returns true if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Gets the TTL remaining for a key
   * @param key Cache key
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  /**
   * Increments a numeric value
   * @param key Cache key
   * @returns New value after increment
   */
  async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  /**
   * Decrements a numeric value
   * @param key Cache key
   * @returns New value after decrement
   */
  async decrement(key: string): Promise<number> {
    return await this.redis.decr(key);
  }
}
