import { Client, Receiver } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

export async function verifyQStashSignature(request) {
  try {
    const signature = request.headers.get("upstash-signature");
    if (!signature) return { valid: false };

    const body = await request.text();
    await qstashReceiver.verify({
      signature,
      body,
    });
    return { valid: true, body: JSON.parse(body) };
  } catch (error) {
    console.error("QStash signature verification failed:", error);
    return { valid: false };
  }
}

export async function publishFileProcessingJob(
  userId,
  fileEntry,
  options = {}
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured");
    }

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

    const response = await qstashClient.publishJSON({
      url: `${baseUrl}/api/dropbox/process-file`,
      body: payload,
      retries: 3,
    });

    return {
      success: true,
      messageId: response.messageId,
    };
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured");
    }

    const payload = {
      documentId,
      userId,
    };

    const response = await qstashClient.publishJSON({
      url: `${baseUrl}/api/documents/process`,
      body: payload,
      retries: 3,
    });

    return {
      success: true,
      messageId: response.messageId,
    };
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
    messageIds: [],
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
        results.messageIds.push(result.value.messageId);
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
