import crypto from "node:crypto";

export function generateAPIKey() {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

export function generateSecretKey() {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}
