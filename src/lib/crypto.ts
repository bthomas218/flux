import crypto, { createCipheriv } from "node:crypto";
import { hash, compare } from "bcrypt-ts";

const ALGORITHM = "aes-256-gcm";

export function generateAPIKey() {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

export function generateSecretKey() {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

export async function hashKey(key: string) {
  return await hash(key, 10);
}

export async function encrypt(secretKey: string, iv: string, data: string) {
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  const encryptedData = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv,
    content: encryptedData.toString("hex"),
    tag: authTag.toString("hex"),
  };
}

export async function decrypt(
  secretKey: string,
  iv: string,
  data: string,
  tag: string,
) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  const decryptedData = Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]);

  return decryptedData.toString("utf8");
}

export async function verifyKey(key: string, hash: string) {
  return await compare(key, hash);
}
