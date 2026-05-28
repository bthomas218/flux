import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import apiKeyAuth from "../../plugins/apiKeyAuth.js";
import {
  uploadFileHandler,
  getFileHandler,
  listFilesHandler,
} from "./filesController.js";
import {
  getFileParamsSchema,
  getFileResponseSchema,
  listFilesResponseSchema,
} from "./filesSchemas.js";

export function filesRoutes(app: FastifyInstance) {
  app.register(import("@fastify/multipart"));
  app.register(apiKeyAuth);

  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/files",
    {
      schema: {
        response: {
          200: getFileResponseSchema,
        },
      },
    },
    uploadFileHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/files",
    {
      schema: {
        response: {
          200: listFilesResponseSchema,
        },
      },
    },
    listFilesHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/files/:id",
    {
      schema: {
        params: getFileParamsSchema,
        response: {
          200: getFileResponseSchema,
        },
      },
    },
    getFileHandler,
  );
}
