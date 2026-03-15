import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { envVars } from "./env";

type S3ObjectRef = {
  bucket: string;
  key: string;
};

const s3 = new S3Client({
  region: envVars.S3.REGION,
  endpoint: envVars.S3.ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: envVars.S3.ACCESS_KEY_ID,
    secretAccessKey: envVars.S3.SECRET_ACCESS_KEY,
  },
});

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(paddingLength);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function parseS3ObjectFromUrl(rawUrl: string): S3ObjectRef | null {
  if (!rawUrl) return null;

  if (rawUrl.startsWith("s3://")) {
    const withoutScheme = rawUrl.slice("s3://".length);
    const [bucket, ...keyParts] = withoutScheme.split("/");
    const key = keyParts.join("/");
    if (!bucket || !key) return null;
    return { bucket, key };
  }

  try {
    const imageUrl = new URL(rawUrl);

    const endpointUrl = new URL(envVars.S3.ENDPOINT);
    if (imageUrl.host === endpointUrl.host) {
      const path = imageUrl.pathname.replace(/^\/+/, "");
      if (!path) return null;

      const [bucket, ...keyParts] = path.split("/");
      const key = keyParts.join("/");
      if (!bucket || !key) return null;

      return { bucket, key };
    }

    if (envVars.IMGPROXY.BASE_URL) {
      const imgproxyBaseUrl = new URL(envVars.IMGPROXY.BASE_URL);
      if (imageUrl.host === imgproxyBaseUrl.host) {
        const pathSegments = imageUrl.pathname.split("/").filter(Boolean);
        const encodedSrcWithExt = pathSegments[pathSegments.length - 1];

        if (!encodedSrcWithExt) return null;

        const encodedSrc = encodedSrcWithExt.replace(/\.[^.]+$/, "");
        const decoded = decodeBase64Url(encodedSrc);
        if (!decoded || !decoded.startsWith("s3://")) return null;

        return parseS3ObjectFromUrl(decoded);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function deleteS3ObjectsByKeys(
  keys: string[],
  bucket = envVars.S3.BUCKET_NAME,
): Promise<{ deleted: string[]; failed: string[] }> {
  const uniqueKeys = Array.from(
    new Set(keys.map((key) => key.replace(/^\/+/, "").trim()).filter(Boolean)),
  );

  if (!bucket || uniqueKeys.length === 0) {
    return { deleted: [], failed: uniqueKeys };
  }

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const key of uniqueKeys) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      deleted.push(key);
    } catch {
      failed.push(key);
    }
  }

  return { deleted, failed };
}

export async function deleteS3ObjectsByUrls(
  urls: string[],
): Promise<{ deleted: string[]; failed: string[] }> {
  const objectRefs = urls
    .map(parseS3ObjectFromUrl)
    .filter(Boolean) as S3ObjectRef[];

  if (objectRefs.length === 0) {
    return { deleted: [], failed: [] };
  }

  const grouped = objectRefs.reduce<Record<string, string[]>>((acc, ref) => {
    acc[ref.bucket] = acc[ref.bucket] ?? [];
    acc[ref.bucket].push(ref.key);
    return acc;
  }, {});

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const [bucket, keys] of Object.entries(grouped)) {
    const result = await deleteS3ObjectsByKeys(keys, bucket);
    deleted.push(...result.deleted.map((key) => `${bucket}/${key}`));
    failed.push(...result.failed.map((key) => `${bucket}/${key}`));
  }

  return { deleted, failed };
}
