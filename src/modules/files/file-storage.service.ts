import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NotFoundError } from "../../errors.js";

export class FileStorageService {
  constructor() {}

  private projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );

  private resolveStoragePath(filePath: string) {
    return path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.projectRoot, filePath);
  }

  async exists(filePath: string) {
    const absolutePath = this.resolveStoragePath(filePath);

    try {
      await fs.promises.access(absolutePath, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  async read(filePath: string) {
    const absolutePath = this.resolveStoragePath(filePath);

    if (!(await this.exists(absolutePath))) {
      throw new NotFoundError("File not found on disk");
    }

    return fs.createReadStream(absolutePath);
  }

  async write(filePath: string, file: NodeJS.ReadableStream) {
    const absolutePath = this.resolveStoragePath(filePath);

    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await pipeline(file, fs.createWriteStream(absolutePath));

    return fs.promises.stat(absolutePath).then((stats) => stats.size);
  }

  async delete(filePath: string) {
    const absolutePath = this.resolveStoragePath(filePath);

    try {
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
