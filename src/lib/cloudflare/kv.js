function kvApiBase() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not configured");
  }

  if (!namespaceId) {
    throw new Error("CLOUDFLARE_KV_NAMESPACE_ID is not configured");
  }

  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`;
}

async function kvRequest(path, options = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is not configured");
  }

  const response = await fetch(`${kvApiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Cloudflare KV request failed: ${details}`);
  }

  return response;
}

async function getJson(key) {
  const response = await kvRequest(`/values/${encodeURIComponent(key)}`);
  if (!response) return null;

  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text);
}

async function putJson(key, value, ttlSeconds) {
  const params = new URLSearchParams();
  if (ttlSeconds) {
    params.set("expiration_ttl", String(ttlSeconds));
  }

  const suffix = params.toString() ? `?${params}` : "";
  await kvRequest(`/values/${encodeURIComponent(key)}${suffix}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
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
