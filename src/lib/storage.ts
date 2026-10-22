import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Private file storage for maintenance requests (details + photo) while they await approval.
// Uses an S3 bucket when ELORA_S3_* is set; when testing locally it falls back to a temp folder.

const { ELORA_S3_BUCKET: bucket, ELORA_S3_REGION: region, ELORA_S3_ACCESS_KEY_ID: accessKeyId, ELORA_S3_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
const useS3 = Boolean(bucket && region && accessKeyId && secretAccessKey);
const localDir = path.join(tmpdir(), "elora-maintenance");

// A live site needs S3: serverless instances don't keep local files between requests.
export const storageAvailable = useS3 || process.env.NODE_ENV !== "production";

let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({ region, credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! } }));

export async function putFile(key: string, body: Buffer | string, contentType: string) {
  if (useS3) {
    await s3().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    return;
  }
  const file = path.join(localDir, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function getFile(key: string): Promise<Buffer | null> {
  try {
    if (useS3) {
      const res = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return res.Body ? Buffer.from(await res.Body.transformToByteArray()) : null;
    }
    return await readFile(path.join(localDir, key));
  } catch {
    return null;
  }
}
