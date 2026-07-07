import { randomUUID, createHmac } from "crypto";

const WORKER_URL = process.env.CLOUDFLARE_QUEUE_WORKER_URL;
const WORKER_SECRET = process.env.CLOUDFLARE_QUEUE_WORKER_SECRET;
const R2_SIGNING_SECRET =
  process.env.INTERNAL_JOB_SECRET || process.env.CLOUDFLARE_QUEUE_WORKER_SECRET;

function getWorkerUrl() {
  if (!WORKER_URL) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_URL is not configured");
  }

  return WORKER_URL;
}

function getWorkerSecret() {
  if (!WORKER_SECRET) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_SECRET is not configured");
  }

  return WORKER_SECRET;
}

function getSigningSecret() {
  if (!R2_SIGNING_SECRET) {
    throw new Error("R2 signing secret is not configured");
  }

  return R2_SIGNING_SECRET;
}

function signR2Request(method, key, expiresAt) {
  const payload = `${method}:${key}:${expiresAt}`;
  return createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

function buildR2Url(method, key, expiresIn) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const signature = signR2Request(method, key, expiresAt);
  const url = new URL("/r2/object", getWorkerUrl());
  url.searchParams.set("key", key);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);
  url.searchParams.set("method", method);
  return url.toString();
}

async function r2Request(method, key, body = null, extraHeaders = {}) {
  const url = new URL("/r2/object", getWorkerUrl());
  url.searchParams.set("key", key);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getWorkerSecret()}`,
      ...extraHeaders,
    },
    body,
  });

  return response;
}

export async function uploadToR2(file, key) {
  const response = await r2Request(
    "PUT",
    key,
    file.arrayBuffer ? Buffer.from(await file.arrayBuffer()) : file,
    {
      "Content-Type": file.type || "application/octet-stream",
    }
  );

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to upload to R2: ${details}`);
  }

  return key;
}

export function generateDocumentKey(userId, fileName) {
  const uuid = randomUUID();
  const baseName = fileName.split("/").pop().split("\\").pop();
  const sanitized = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${userId}/${uuid}-${sanitized}`;
}

export async function generatePresignedUploadUrl(
  key,
  contentType,
  expiresIn = 300
) {
  const url = new URL(buildR2Url("PUT", key, expiresIn));
  url.searchParams.set("contentType", contentType);
  return url.toString();
}

export async function generatePresignedDownloadUrl(key, expiresIn = 300) {
  return buildR2Url("GET", key, expiresIn);
}

export async function verifyObjectExists(key) {
  const response = await r2Request("HEAD", key);

  if (response.status === 404) {
    return { exists: false };
  }

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to verify R2 object: ${details}`);
  }

  return {
    exists: true,
    size: Number(response.headers.get("content-length") || 0),
    contentType:
      response.headers.get("content-type") || "application/octet-stream",
  };
}

export async function deleteFromR2(key) {
  const response = await r2Request("DELETE", key);

  if (!response.ok && response.status !== 404) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to delete from R2: ${details}`);
  }
}
