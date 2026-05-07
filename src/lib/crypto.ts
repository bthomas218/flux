import crypto, { createCipheriv } from "node:crypto";
import { hash, compare } from "bcrypt-ts";

const ALGORITHM = "aes-256-gcm";
const SALT_ROUNDS = 10;

export function generateAPIKey() {
  return `sk_${generateToken()}`;
}

export function generateSecretKey() {
  return `whsec_${generateToken()}`;
}

export function generateToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export async function toHash(data: string) {
  return await hash(data, SALT_ROUNDS);
}

export function toDeterministicHash(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
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

export async function verifyHash(candidateHash: string, hash: string) {
  return await compare(candidateHash, hash);
}
