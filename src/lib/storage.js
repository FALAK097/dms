import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT_URL,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
  forcePathStyle: false,
});

export async function uploadToSpaces(file, key) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const params = {
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand(params));

  return getCdnUrl(key);
}

export function generateDocumentKey(userId, fileName) {
  const timestamp = Date.now();
  const baseName = fileName.split("/").pop().split("\\").pop();
  const sanitized = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `documents/${userId}/${timestamp}-${sanitized}`;
}

export async function deleteFromSpaces(key) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function generatePresignedUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900,
  });

  return presignedUrl;
}

export function getCdnUrl(key) {
  const endpoint = process.env.DO_SPACES_ENDPOINT_URL.replace("https://", "");
  return `https://${process.env.DO_SPACES_NAME}.${endpoint.replace(
    "digitaloceanspaces.com",
    "cdn.digitaloceanspaces.com"
  )}/${key}`;
}
