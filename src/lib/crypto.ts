import crypto from "node:crypto";
import { getEnv } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function keyFromSecret() {
  const secret = getEnv().AUTH_SECRET;
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters for Google token storage.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, keyFromSecret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const [ivRaw, authTagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !authTagRaw || !encryptedRaw) {
    return null;
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyFromSecret(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
