function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function isAuthorized(request, env) {
  const authorization = request.headers.get("authorization") || "";
  return authorization === `Bearer ${env.QUEUE_WORKER_SECRET}`;
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
