import crypto from "crypto";
import status from "http-status";
import { envVars } from "../../config/env";
import { AppError } from "../errors/app-error";

const base = envVars.IMGPROXY.BASE_URL;
const keyHex = envVars.IMGPROXY.SECRET_KEY;
const saltHex = envVars.IMGPROXY.SALT;

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function imgproxyURL(src: string, ops = "resize:fit:1200:1200:1") {
  if (!keyHex || !saltHex || !base) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Missing image proxy configuration: key, salt, or base URL",
    );
  }

  const key = Buffer.from(keyHex, "hex");
  const salt = Buffer.from(saltHex, "hex");
  const encodedSrc = b64url(src);
  const path = `/${ops}/${encodedSrc}.webp`;
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(salt);
  hmac.update(path);
  const sig = b64url(hmac.digest());
  return `${base}/${sig}${path}`;
}
