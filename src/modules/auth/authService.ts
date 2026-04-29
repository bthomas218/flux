import { generateAPIKey, generateSecretKey } from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ConflictError } from "../../errors.js";

export async function createUser(email: string) {
  try {
    return await prisma.user.create({
      data: {
        email: email,
        apiKey: generateAPIKey(),
        webhookSecret: generateSecretKey(),
      },
    });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        throw new ConflictError("User already exists");
      }
    }
    throw err;
  }
}
