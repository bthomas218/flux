import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { BadRequestError } from "../../errors.js";
import {
  deleteFileResponseSchema,
  getFileParamsSchema,
  getFileResponseSchema,
  listFilesResponseSchema,
} from "./file.schemas.js";

export async function fileRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: {
        response: {
          200: getFileResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        throw new BadRequestError("Request is not multipart/form-data");
      }

      const data = await request.file();

      if (!data) {
        throw new BadRequestError("No file provided in the request");
      }

      const userId = request.apiKey!.userId;
      const { file, filename, mimetype } = data;
      const uploadedFile = await app.fileService.upload(
        userId,
        file,
        filename,
        mimetype,
      );

      reply.send(uploadedFile);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      schema: {
        response: {
          200: listFilesResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;

      reply.send(await app.fileService.findMany(userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: {
        params: getFileParamsSchema,
        response: {
          200: getFileResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;

      reply.send(await app.fileService.findOne(request.params.id, userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id/download",
    {
      schema: {
        params: getFileParamsSchema,
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;
      const { stream, filename, mimeType, size } =
        await app.fileService.download(request.params.id, userId);

      const safeFilename = filename.replace(/["\\\r\n]/g, "_");

      reply
        .type(mimeType)
        .header("Content-Length", size.toString())
        .header(
          "Content-Disposition",
          `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        );

      return reply.send(stream);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().delete(
    "/:id",
    {
      schema: {
        params: getFileParamsSchema,
        response: {
          200: deleteFileResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;

      reply.send(await app.fileService.delete(request.params.id, userId));
    },
  );
}
