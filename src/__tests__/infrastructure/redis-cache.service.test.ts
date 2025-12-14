import { describe, expect, it, beforeEach, mock } from "bun:test";
import { RedisCacheService } from "../../infrastructure/services/redis-cache.service";

describe("RedisCacheService", () => {
  let service: RedisCacheService;
  let mockRedis: {
    get: ReturnType<typeof mock>;
    set: ReturnType<typeof mock>;
    setex: ReturnType<typeof mock>;
    del: ReturnType<typeof mock>;
    scan: ReturnType<typeof mock>;
    exists: ReturnType<typeof mock>;
    ttl: ReturnType<typeof mock>;
    incr: ReturnType<typeof mock>;
    decr: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockRedis = {
      get: mock(() => Promise.resolve(null)),
      set: mock(() => Promise.resolve("OK")),
      setex: mock(() => Promise.resolve("OK")),
      del: mock(() => Promise.resolve(1)),
      scan: mock(() => Promise.resolve(["0", []])),
      exists: mock(() => Promise.resolve(1)),
      ttl: mock(() => Promise.resolve(-1)),
      incr: mock(() => Promise.resolve(1)),
      decr: mock(() => Promise.resolve(0)),
    };
  });

  describe("constructor", () => {
    it("should throw error when Redis credentials are not provided", () => {
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(() => new RedisCacheService()).toThrow(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required"
      );

      if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    });

    it("should create service with provided options", () => {
      const service = new RedisCacheService({
        url: "https://test-redis.upstash.io",
        token: "test-token",
      });
      expect(service).toBeInstanceOf(RedisCacheService);
    });
  });

  describe("get", () => {
    it("should return cached value when exists", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });

      mockRedis.get.mockResolvedValue({ data: "test-value" });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      const result = await service.get<{ data: string }>("test-key");

      expect(result).toEqual({ data: "test-value" });
      expect(mockRedis.get).toHaveBeenCalledWith("test-key");
    });

    it("should return null when key does not exist", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });

      mockRedis.get.mockResolvedValue(null);
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      const result = await service.get("missing-key");

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should set value without TTL", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      await service.set("key", { value: "data" });

      expect(mockRedis.set).toHaveBeenCalledWith("key", { value: "data" });
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should set value with TTL", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      await service.set("key", "value", 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith("key", 3600, "value");
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe("invalidate", () => {
    it("should delete all keys matching pattern", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      // First scan returns keys, second scan returns empty (cursor 0)
      let scanCall = 0;
      mockRedis.scan.mockImplementation(() => {
        scanCall++;
        if (scanCall === 1) {
          return Promise.resolve(["1", ["quiz:1", "quiz:2", "quiz:3"]]);
        }
        return Promise.resolve(["0", []]);
      });

      await service.invalidate("quiz:*");

      expect(mockRedis.scan).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith("quiz:1", "quiz:2", "quiz:3");
    });

    it("should not call del when no keys match", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.scan.mockResolvedValue(["0", []]);

      await service.invalidate("nonexistent:*");

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a specific key", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      await service.delete("specific-key");

      expect(mockRedis.del).toHaveBeenCalledWith("specific-key");
    });
  });

  describe("exists", () => {
    it("should return true when key exists", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.exists.mockResolvedValue(1);

      const result = await service.exists("existing-key");

      expect(result).toBe(true);
    });

    it("should return false when key does not exist", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.exists.mockResolvedValue(0);

      const result = await service.exists("missing-key");

      expect(result).toBe(false);
    });
  });

  describe("ttl", () => {
    it("should return TTL in seconds", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.ttl.mockResolvedValue(3600);

      const result = await service.ttl("key-with-ttl");

      expect(result).toBe(3600);
    });

    it("should return -1 when key has no TTL", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.ttl.mockResolvedValue(-1);

      const result = await service.ttl("key-without-ttl");

      expect(result).toBe(-1);
    });

    it("should return -2 when key does not exist", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.ttl.mockResolvedValue(-2);

      const result = await service.ttl("nonexistent-key");

      expect(result).toBe(-2);
    });
  });

  describe("increment", () => {
    it("should increment and return new value", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.incr.mockResolvedValue(5);

      const result = await service.increment("counter");

      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith("counter");
    });
  });

  describe("decrement", () => {
    it("should decrement and return new value", async () => {
      const service = new RedisCacheService({
        url: "https://test.upstash.io",
        token: "token",
      });
      (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;

      mockRedis.decr.mockResolvedValue(3);

      const result = await service.decrement("counter");

      expect(result).toBe(3);
      expect(mockRedis.decr).toHaveBeenCalledWith("counter");
    });
  });
});
