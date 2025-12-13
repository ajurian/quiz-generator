/**
 * Service interface for caching operations
 * This is a port - implementation uses Upstash Redis
 */
export interface ICacheService {
  /**
   * Gets a cached value by key
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Sets a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Invalidates cache entries matching a pattern
   * @param pattern Pattern to match (e.g., "quiz:*")
   */
  invalidate(pattern: string): Promise<void>;

  /**
   * Deletes a specific cache entry
   * @param key Cache key to delete
   */
  delete(key: string): Promise<void>;
}
