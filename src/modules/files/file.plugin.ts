import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import apiKeyAuth from "../../plugins/apiKeyAuth.js";
import { FileMetadataService } from "./file-metadata.service.js";
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
    const fileMetadataService = new FileMetadataService(fastify.prisma);
    const fileStorageService = new FileStorageService();
    const fileService = new FileService(
      fileMetadataService,
      fileStorageService,
    );

    fastify.decorate("fileService", fileService);

    fastify.register(multipart);
    fastify.register(apiKeyAuth);
    fastify.register(fileRoutes, { prefix: "files" });
  },
  {
    name: "files",
    dependencies: ["prisma"],
  },
);
