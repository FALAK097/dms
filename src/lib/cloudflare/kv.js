function cloudflareWorkerUrl() {
  const workerUrl = process.env.CLOUDFLARE_QUEUE_WORKER_URL;

  if (!workerUrl) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_URL is not configured");
  }

  return workerUrl;
}

async function kvRequest(operation, body) {
  const token = process.env.CLOUDFLARE_QUEUE_WORKER_SECRET;

  if (!token) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_SECRET is not configured");
  }

  const response = await fetch(new URL(`/kv/${operation}`, cloudflareWorkerUrl()), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    const details = data?.error || response.statusText;
    throw new Error(`Cloudflare KV request failed: ${details}`);
  }

  return data;
}

async function getJson(key) {
  const result = await kvRequest("get", { key });
  const text = result?.value;
  if (!text) return null;

  return JSON.parse(text);
}

async function putJson(key, value, ttlSeconds) {
  await kvRequest("put", {
    key,
    value: JSON.stringify(value),
    expirationTtl: ttlSeconds,
  });
}

export async function rateLimit(identifier, limit = 10, window = 300) {
  try {
    const now = Date.now();
    const windowStart = now - window * 1000;
    const key = `rate_limit:${identifier}`;
    const existing = await getJson(key);
    const hits = (existing?.hits || []).filter(
      (timestamp) => timestamp > windowStart
    );

    if (hits.length >= limit) {
      const oldest = hits[0];
      return {
        success: false,
        remaining: 0,
        reset: Math.ceil((oldest + window * 1000 - now) / 1000),
      };
    }

    hits.push(now);
    await putJson(key, { hits }, Math.max(window, 60));

    return {
      success: true,
      remaining: limit - hits.length,
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
    await putJson(
      key,
      {
        event,
        timestamp: new Date().toISOString(),
        ...data,
      },
      60 * 60 * 24 * 30
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
