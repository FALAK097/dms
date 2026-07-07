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

function targetForJob(type, appUrl) {
  switch (type) {
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
    payload: body.payload,
    enqueuedAt: new Date().toISOString(),
  };

  if (!job.type || !job.payload || !targetForJob(job.type, env.APP_URL)) {
    return { error: "Invalid job payload", status: 400 };
  }

  await env.DMS_JOBS_QUEUE.send(job, { contentType: "json" });
  return { job };
}

async function dispatchJob(job, env) {
  const target = targetForJob(job.type, env.APP_URL);

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

    if (url.pathname !== "/enqueue" || request.method !== "POST") {
      return json({ error: "Not found" }, { status: 404 });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }

    const result = await enqueueJob(env, body);
    if (result.error) {
      return json({ error: result.error }, { status: result.status });
    }

    return json({ success: true, jobId: result.job.jobId });
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
