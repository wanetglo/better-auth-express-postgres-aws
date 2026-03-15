import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";
import status from "http-status";
import { envVars } from "../../config/env";
import { deleteS3ObjectsByKeys, deleteS3ObjectsByUrls } from "../../config/s3";
import { AppError } from "../../shared/errors/app-error";
import { imgproxyURL } from "../../shared/utils/imgproxy";
import {
  ImgproxySignInput,
  UploadDeleteInput,
  UploadPresignInput,
} from "./image.type";

const s3 = new S3Client({
  region: envVars.S3.REGION,
  endpoint: envVars.S3.ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: envVars.S3.ACCESS_KEY_ID,
    secretAccessKey: envVars.S3.SECRET_ACCESS_KEY,
  },
});

const sanitizeFilename = (name = "file") =>
  String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 200) || crypto.randomUUID();

const signImgproxy = async (payload: ImgproxySignInput) => {
  const src = `s3://${payload.bucket}/${payload.key}`;
  const url = imgproxyURL(src, payload.ops ?? "resize:fit:1200:1200:1");

  return { url };
};

const createPresign = async (payload: UploadPresignInput) => {
  const bucket = envVars.S3.BUCKET_NAME;
  if (!bucket) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "S3_BUCKET not configured",
    );
  }

  const safeFilename = sanitizeFilename(payload.filename);
  const key = `${payload.keyPrefix}/${Date.now()}-${safeFilename}`;
  const contentType = payload.contentType;

  const { url, fields } = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 0, payload.maxSize],
      ["starts-with", "$Content-Type", `${contentType.split("/")[0]}/`],
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: 300,
  });

  return { url, fields, key, bucket };
};

const deleteUploads = async (payload: UploadDeleteInput) => {
  const keys = payload.keys ?? [];
  const urls = payload.urls ?? [];

  const byKeys = await deleteS3ObjectsByKeys(keys);
  const byUrls = await deleteS3ObjectsByUrls(urls);

  return {
    deleted: [...byKeys.deleted, ...byUrls.deleted],
    failed: [...byKeys.failed, ...byUrls.failed],
  };
};

export const imageService = {
  signImgproxy,
  createPresign,
  deleteUploads,
};
