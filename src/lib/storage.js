import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

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
  };

  await s3Client.send(new PutObjectCommand(params));

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
  const command = new PutObjectCommand({
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return presignedUrl;
}

export async function generatePresignedDownloadUrl(key, expiresIn = 300) {
  const command = new GetObjectCommand({
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return presignedUrl;
}

export async function verifyObjectExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.DO_SPACES_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);
    return {
      exists: true,
      size: result.ContentLength,
      contentType: result.ContentType,
    };
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw error;
  }
}

export async function deleteFromSpaces(key) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.DO_SPACES_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function getCdnUrl(key) {
  return key;
}
