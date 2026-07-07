function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, HEAD, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, content-type, x-internal-job-secret",
    "Access-Control-Expose-Headers": "content-length, content-type, etag",
  };
}

function isAuthorized(request, env) {
  const authorization = request.headers.get("authorization") || "";
  return authorization === `Bearer ${env.QUEUE_WORKER_SECRET}`;
}

async function isSignedR2Request(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const expires = url.searchParams.get("expires");
  const signature = url.searchParams.get("signature");
  const method = url.searchParams.get("method") || request.method;

  if (!key || !expires || !signature) {
    return false;
  }

  const signingSecret = env.INTERNAL_JOB_SECRET || env.QUEUE_WORKER_SECRET;

  if (!signingSecret) {
    return false;
  }

  if (Number(expires) < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const secretKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    new TextEncoder().encode(`${method}:${key}:${expires}`)
  );

  const expected = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function targetForJob(job) {
  if (!job.appUrl) {
    return null;
  }

  const appUrl = new URL(job.appUrl);

  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
    return null;
  }

  switch (job.type) {
    case "documents.process":
      return new URL("/api/documents/process", appUrl);
    case "dropbox.process_file":
      return new URL("/api/dropbox/process-file", appUrl);
    default:
      return null;
  }
}

async function enqueueJob(env, body) {
  const job = {
    jobId: body.jobId || crypto.randomUUID(),
    type: body.type,
    appUrl: body.appUrl,
    payload: body.payload,
    enqueuedAt: new Date().toISOString(),
  };

  if (!job.type || !job.payload || !targetForJob(job)) {
    return { error: "Invalid job payload", status: 400 };
  }

  await env.DMS_JOBS_QUEUE.send(job, { contentType: "json" });
  return { job };
}

async function handleVectorize(request, env, operation) {
  const body = await parseJson(request);

  if (!body) {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (operation) {
    case "upsert": {
      await env.DMS_VECTORIZE.upsert(body.vectors || []);
      return json({ success: true });
    }
    case "query": {
      const matches = await env.DMS_VECTORIZE.query(body.vector, {
        topK: body.topK,
        namespace: body.namespace,
        returnMetadata: body.returnMetadata,
        returnValues: body.returnValues,
        filter: body.filter,
      });
      return json({ success: true, result: matches });
    }
    case "delete_by_ids": {
      await env.DMS_VECTORIZE.deleteByIds(body.ids || []);
      return json({ success: true });
    }
    default:
      return json({ error: "Not found" }, { status: 404 });
  }
}

async function handleKv(request, env, operation) {
  const body = await parseJson(request);

  if (!body?.key) {
    return json({ error: "KV key is required" }, { status: 400 });
  }

  switch (operation) {
    case "get": {
      const value = await env.DMS_KV.get(body.key);
      return json({ success: true, value });
    }
    case "put": {
      await env.DMS_KV.put(body.key, body.value, {
        expirationTtl: body.expirationTtl,
      });
      return json({ success: true });
    }
    default:
      return json({ error: "Not found" }, { status: 404 });
  }
}

async function handleR2(request, env, operation) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (!key) {
    return json({ error: "R2 key is required" }, { status: 400, headers: corsHeaders() });
  }

  const internalRequest = isAuthorized(request, env);
  const signedRequest = await isSignedR2Request(request, env);

  if (!internalRequest && !signedRequest) {
    return json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  switch (operation) {
    case "object": {
      if (request.method === "PUT") {
        const body = await request.arrayBuffer();
        const object = await env.DMS_BUCKET.put(key, body, {
          httpMetadata: {
            contentType:
              request.headers.get("content-type") ||
              "application/octet-stream",
          },
        });
        return json(
          { success: true, key: object.key, size: object.size },
          { headers: corsHeaders() }
        );
      }

      if (request.method === "GET") {
        const object = await env.DMS_BUCKET.get(key);
        if (!object) {
          return new Response("Not found", {
            status: 404,
            headers: corsHeaders(),
          });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        Object.entries(corsHeaders()).forEach(([name, value]) =>
          headers.set(name, value)
        );
        return new Response(object.body, { headers });
      }

      if (request.method === "HEAD") {
        const object = await env.DMS_BUCKET.head(key);
        if (!object) {
          return new Response(null, { status: 404, headers: corsHeaders() });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("content-length", String(object.size));
        Object.entries(corsHeaders()).forEach(([name, value]) =>
          headers.set(name, value)
        );
        return new Response(null, { status: 200, headers });
      }

      if (request.method === "DELETE") {
        await env.DMS_BUCKET.delete(key);
        return json({ success: true }, { headers: corsHeaders() });
      }

      return json({ error: "Method not allowed" }, {
        status: 405,
        headers: corsHeaders(),
      });
    }
    default:
      return json({ error: "Not found" }, { status: 404, headers: corsHeaders() });
  }
}

async function dispatchJob(job, env) {
  const target = targetForJob(job);

  if (!target) {
    return {
      ok: false,
      retryable: false,
      status: 400,
      details: `Unknown job type: ${job.type}`,
    };
  }

  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-job-secret": env.INTERNAL_JOB_SECRET,
      "x-background-job-id": job.jobId,
    },
    body: JSON.stringify(job.payload),
  });

  if (response.ok) {
    return { ok: true, status: response.status };
  }

  const details = await response.text().catch(() => "");

  return {
    ok: false,
    retryable: response.status >= 500 || response.status === 429,
    status: response.status,
    details,
  };
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/r2/object") {
      return handleR2(request, env, "object");
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method === "POST" && url.pathname === "/enqueue") {
      const body = await parseJson(request);

      if (!body) {
        return json({ error: "Invalid JSON" }, { status: 400 });
      }

      const result = await enqueueJob(env, body);
      if (result.error) {
        return json({ error: result.error }, { status: result.status });
      }

      return json({ success: true, jobId: result.job.jobId });
    }

    if (request.method === "POST" && url.pathname.startsWith("/vectorize/")) {
      return handleVectorize(request, env, url.pathname.split("/").at(-1));
    }

    if (request.method === "POST" && url.pathname.startsWith("/kv/")) {
      return handleKv(request, env, url.pathname.split("/").at(-1));
    }

    return json({ error: "Not found" }, { status: 404 });
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const result = await dispatchJob(message.body, env);

        if (result.ok) {
          message.ack();
          continue;
        }

        console.error("DMS job failed", {
          jobId: message.body?.jobId,
          type: message.body?.type,
          status: result.status,
          details: result.details,
        });

        if (result.retryable) {
          const delaySeconds = Math.min(30 * 2 ** message.attempts, 43200);
          message.retry({ delaySeconds });
        } else {
          message.ack();
        }
      } catch (error) {
        console.error("DMS job dispatch error", {
          jobId: message.body?.jobId,
          type: message.body?.type,
          error: error.message,
        });
        const delaySeconds = Math.min(30 * 2 ** message.attempts, 43200);
        message.retry({ delaySeconds });
      }
    }
  },
};

export default worker;
