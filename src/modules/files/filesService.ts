import { BadRequestError } from "../../errors.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";

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
  fs.mkdirSync(path.dirname(url), { recursive: true });
  await pipeline(stream, fs.createWriteStream(url));

  return url;
}
