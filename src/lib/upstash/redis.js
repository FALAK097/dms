import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export async function rateLimit(identifier, limit = 10, window = 300) {
  try {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    await redis.zremrangebyscore(key, 0, windowStart);

    const currentCount = await redis.zcard(key);

    if (currentCount >= limit) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetTime = oldest[0]?.score
        ? Math.ceil((oldest[0].score + window * 1000 - now) / 1000)
        : window;

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
      };
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, window);

    return {
      success: true,
      remaining: limit - currentCount - 1,
      reset: window,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    return {
      success: false,
      remaining: 0,
      reset: 60,
      error: "Rate limiting unavailable",
    };
  }
}

export async function auditLog(event, data) {
  try {
    const key = `audit:${event}:${Date.now()}`;
    await redis.setex(
      key,
      60 * 60 * 24 * 30,
      JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...data,
      })
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
