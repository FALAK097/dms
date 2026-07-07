import { randomUUID } from "crypto";

const WORKER_URL = process.env.CLOUDFLARE_QUEUE_WORKER_URL;
const WORKER_SECRET = process.env.CLOUDFLARE_QUEUE_WORKER_SECRET;
const INTERNAL_JOB_SECRET = process.env.INTERNAL_JOB_SECRET;

export function verifyInternalJobRequest(request) {
  const configuredSecret = INTERNAL_JOB_SECRET || WORKER_SECRET;

  if (!configuredSecret) {
    console.error("INTERNAL_JOB_SECRET is not configured");
    return false;
  }

  const providedSecret = request.headers.get("x-internal-job-secret");
  return providedSecret === configuredSecret;
}

async function publishJob(type, payload) {
  if (!WORKER_URL) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_URL is not configured");
  }

  if (!WORKER_SECRET) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_SECRET is not configured");
  }

  const jobId = randomUUID();
  const response = await fetch(new URL("/enqueue", WORKER_URL), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WORKER_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId, type, payload }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Cloudflare queue publish failed (${response.status}): ${details}`
    );
  }

  const result = await response.json().catch(() => ({}));

  return {
    success: true,
    jobId: result.jobId || jobId,
  };
}

export async function publishFileProcessingJob(
  userId,
  fileEntry,
  options = {}
) {
  try {
    const payload = {
      userId,
      fileEntry: {
        name: fileEntry.name,
        path_display: fileEntry.path_display,
        size: fileEntry.size,
        content_hash: fileEntry.content_hash,
      },
      source: options.source || "webhook",
    };

    return await publishJob("dropbox.process_file", payload);
  } catch (error) {
    console.error("Failed to publish file processing job:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function publishOCRProcessingJob(documentId, userId) {
  try {
    return await publishJob("documents.process", { documentId, userId });
  } catch (error) {
    console.error("Failed to publish OCR processing job:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function publishBatchFileProcessingJobs(
  userId,
  fileEntries,
  options = {}
) {
  const results = {
    success: true,
    queuedCount: 0,
    failedCount: 0,
    jobIds: [],
  };

  const batchSize = 10;
  for (let i = 0; i < fileEntries.length; i += batchSize) {
    const batch = fileEntries.slice(i, i + batchSize);

    const promises = batch.map((fileEntry) =>
      publishFileProcessingJob(userId, fileEntry, options)
    );

    const batchResults = await Promise.allSettled(promises);

    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        results.queuedCount++;
        results.jobIds.push(result.value.jobId);
      } else {
        results.failedCount++;
      }
    });
  }

  if (results.failedCount > 0) {
    results.success = false;
  }

  return results;
}
