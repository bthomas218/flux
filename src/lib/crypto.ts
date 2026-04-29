import crypto from "node:crypto";
import { hash, compare } from "bcrypt-ts";

export function generateAPIKey() {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

export function generateSecretKey() {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

export async function hashKey(key: string) {
  return await hash(key, 10);
}

export async function verifyKey(key: string, hash: string) {
  return await compare(key, hash);
}
