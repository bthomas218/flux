import { BadRequestError } from "../../errors.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { prisma } from "../../lib/prisma.js";

// Only images for now
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif"];

export async function uploadFileService(
  userId: string,
  stream: NodeJS.ReadableStream,
  filename: string,
  mimetype: string,
) {
  if (!allowedMimeTypes.includes(mimetype)) {
    throw new BadRequestError("Unsupported file type");
  }

  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new BadRequestError("Unsupported file extension");
  }

  const url = path.join("uploads", `${userId}-${Date.now()}-${filename}`);

  await fs.promises.mkdir(path.dirname(url), { recursive: true });
  await pipeline(stream, fs.createWriteStream(url));
  const size = await fs.promises
    .stat(url)
    .then((stats) => stats.size)
    .catch(() => -1);

  const file = await prisma.file.create({
    data: {
      userId,
      filename,
      mimeType: mimetype,
      url,
      storageKey: "", // Placeholder for storage key if using external storage
      size,
    },
  });

  return file;
}
