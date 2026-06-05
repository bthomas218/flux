import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import {
  createFileMetadataService,
  FileMetadataService,
} from "./file-metadata.service.js";
import { FileStorageService } from "./file-storage.service.js";
import { FileService } from "./file.service.js";
import { fileRoutes } from "./file.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    fileService: FileService;
    fileStorageService: FileStorageService;
    fileMetaDataService: FileMetadataService;
  }
}

export default fp(
  async function filePlugin(fastify) {
    const fileMetadataService = createFileMetadataService(fastify.prisma);
    const fileStorageService = new FileStorageService();
    const fileService = new FileService(
      fileMetadataService,
      fileStorageService,
    );

    fastify.decorate("fileService", fileService);
    fastify.decorate("fileMetaDataService", fileMetadataService);
    fastify.decorate("fileStorageService", fileStorageService);

    fastify.register(multipart);
    fastify.register(fileRoutes, { prefix: "files" });
  },
  {
    name: "files",
    dependencies: ["prisma"],
  },
);
