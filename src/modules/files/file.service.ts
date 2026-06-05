import path from "node:path";
import { BadRequestError } from "../../errors.js";
import { generateToken } from "../../lib/crypto.js";
import { FileMetadataService } from "./file-metadata.service.js";
import { FileStorageService } from "./file-storage.service.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif"];

export class FileService {
  constructor(
    private fileMetaDataService: FileMetadataService,
    private fileStorageService: FileStorageService,
  ) {}

  async upload(
    userId: string,
    stream: NodeJS.ReadableStream,
    filename: string,
    mimetype: string,
  ) {
    this.validateFile(filename, mimetype);

    const url = path.join("uploads", `${userId}-${Date.now()}-${filename}`);
    const size = await this.fileStorageService.write(url, stream);

    return this.fileMetaDataService.create({
      userId,
      filename,
      mimeType: mimetype,
      url,
      storageKey: generateToken(),
      size,
    });
  }

  async findOne(fileId: string, userId: string) {
    return this.fileMetaDataService.findOne(fileId, userId);
  }

  async findMany(userId: string) {
    return this.fileMetaDataService.findMany(userId);
  }

  async download(fileId: string, userId: string) {
    const file = await this.fileMetaDataService.findOne(fileId, userId);
    const stream = await this.fileStorageService.read(file.url);

    return {
      stream,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  async delete(fileId: string, userId: string) {
    const file = await this.fileMetaDataService.findOne(fileId, userId);

    await this.fileMetaDataService.ensureNotInUse(file.id);
    await this.fileStorageService.delete(file.url);
    await this.fileMetaDataService.markDeleted(file.id);

    return {
      success: true,
    };
  }

  private validateFile(filename: string, mimetype: string) {
    if (!allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestError("Unsupported file type");
    }

    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new BadRequestError("Unsupported file extension");
    }
  }
}
