import { BadRequestError, ConflictError, NotFoundError } from "../../errors.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { prisma } from "../../lib/prisma.js";
import { generateToken } from "../../lib/crypto.js";

// Only images for now
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif"];

export async function uploadFile(
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
      storageKey: generateToken(), // Placeholder for storage key if using external storage
      size,
    },
  });

  return file;
}

export async function getFile(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
      deletedAt: null,
    },
  });

  if (!file) {
    throw new NotFoundError("File not found");
  }

  return file;
}

export async function listFiles(userId: string) {
  const files = await prisma.file.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });
  return files;
}

export async function deleteFile(fileId: string, userId: string) {
  const file = await getFile(fileId, userId);

  const isInUse = await prisma.job.findFirst({
    where: {
      fileId: file.id,
      status: {
        in: ["PENDING", "IN_PROGRESS"],
      },
      finishedAt: null,
    },
  });

  if (isInUse) {
    throw new ConflictError("File is currently in use");
  }

  const absolutePath = path.resolve(process.cwd(), file.url);

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  await prisma.file.update({
    where: {
      id: file.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    success: true,
  };
}

export async function downloadFile(fileId: string, userId: string) {
  const file = await getFile(fileId, userId);

  const absolutePath = path.resolve(process.cwd(), file.url);

  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError("File not found on disk");
  }

  const stream = fs.createReadStream(absolutePath);

  return {
    stream,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
  };
}
