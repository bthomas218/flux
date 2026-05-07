import * as crypto from "../src/lib/crypto.js";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Encryption and Decryption", () => {
  const secretKey = randomBytes(32).toString("hex"); // 32 bytes for aes-256
  const iv = randomBytes(12).toString("hex"); // 12 bytes IV

  describe("toDeterministicHash", () => {
    it("should return the same hash for the same data and secret", () => {
      const firstHash = crypto.toDeterministicHash("token", "secret");
      const secondHash = crypto.toDeterministicHash("token", "secret");

      expect(secondHash).toBe(firstHash);
    });

    it("should return a different hash for a different secret", () => {
      const firstHash = crypto.toDeterministicHash("token", "secret");
      const secondHash = crypto.toDeterministicHash("token", "other-secret");

      expect(secondHash).not.toBe(firstHash);
    });
  });

  describe("encrypt", () => {
    it("should encrypt data successfully", async () => {
      const data = "Hello, World!";
      const result = await crypto.encrypt(secretKey, iv, data);
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("tag");
      expect(result.iv).toBe(iv);
    });

    it("should handle empty string", async () => {
      const data = "";
      const result = await crypto.encrypt(secretKey, iv, data);
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("tag");
    });

    it("should handle long data", async () => {
      const data = "A".repeat(1000);
      const result = await crypto.encrypt(secretKey, iv, data);
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("tag");
    });
  });

  describe("decrypt", () => {
    it("should decrypt data correctly", async () => {
      const data = "Hello, World!";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const decrypted = await crypto.decrypt(
        secretKey,
        encrypted.iv,
        encrypted.content,
        encrypted.tag,
      );
      expect(decrypted).toBe(data);
    });

    it("should decrypt empty string", async () => {
      const data = "";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const decrypted = await crypto.decrypt(
        secretKey,
        encrypted.iv,
        encrypted.content,
        encrypted.tag,
      );
      expect(decrypted).toBe(data);
    });

    it("should decrypt long data", async () => {
      const data = "A".repeat(1000);
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const decrypted = await crypto.decrypt(
        secretKey,
        encrypted.iv,
        encrypted.content,
        encrypted.tag,
      );
      expect(decrypted).toBe(data);
    });

    it("should throw error with wrong secret key", async () => {
      const data = "Hello, World!";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const wrongKey = randomBytes(32).toString("hex");
      await expect(
        crypto.decrypt(
          wrongKey,
          encrypted.iv,
          encrypted.content,
          encrypted.tag,
        ),
      ).rejects.toThrow();
    });

    it("should throw error with wrong IV", async () => {
      const data = "Hello, World!";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const wrongIv = "wrongiv".repeat(2); // 16 bytes but wrong
      await expect(
        crypto.decrypt(secretKey, wrongIv, encrypted.content, encrypted.tag),
      ).rejects.toThrow();
    });

    it("should throw error with wrong auth tag", async () => {
      const data = "Hello, World!";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const wrongTag = "wrongtag".repeat(2); // 16 bytes but wrong
      await expect(
        crypto.decrypt(secretKey, encrypted.iv, encrypted.content, wrongTag),
      ).rejects.toThrow();
    });

    it("should throw error with tampered content", async () => {
      const data = "Hello, World!";
      const encrypted = await crypto.encrypt(secretKey, iv, data);
      const tamperedContent = encrypted.content.slice(0, -2) + "00"; // tamper last bytes
      await expect(
        crypto.decrypt(secretKey, encrypted.iv, tamperedContent, encrypted.tag),
      ).rejects.toThrow();
    });
  });
});
