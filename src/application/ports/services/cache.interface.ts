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

  // ============================================================================
  // Hash Operations (for storing multiple fields under a single key)
  // ============================================================================

  /**
   * Sets a field in a hash
   * @param key Hash key
   * @param field Field name within the hash
   * @param value Value to store
   * @param ttl Time to live in seconds for the entire hash (optional, refreshes on each set)
   */
  hset<T>(key: string, field: string, value: T, ttl?: number): Promise<void>;

  /**
   * Gets a field from a hash
   * @param key Hash key
   * @param field Field name within the hash
   * @returns Field value or null if not found
   */
  hget<T>(key: string, field: string): Promise<T | null>;

  /**
   * Gets all fields and values from a hash
   * @param key Hash key
   * @returns Object with all field-value pairs, or null if key doesn't exist
   */
  hgetall<T>(key: string): Promise<Record<string, T> | null>;

  /**
   * Deletes a field from a hash
   * @param key Hash key
   * @param field Field name to delete
   */
  hdel(key: string, field: string): Promise<void>;

  /**
   * Sets the TTL (time to live) on a key
   * @param key Cache key
   * @param ttl Time to live in seconds
   */
  expire(key: string, ttl: number): Promise<void>;
}
