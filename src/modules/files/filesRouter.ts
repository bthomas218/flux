import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import apiKeyAuth from "../../plugins/apiKeyAuth.js";
import {
  uploadFileHandler,
  getFileHandler,
  listFilesHandler,
} from "./filesController.js";

export function filesRoutes(app: FastifyInstance) {
  app.register(import("@fastify/multipart"));
  app.register(apiKeyAuth);

  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/files",
    {
      schema: {},
    },
    uploadFileHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/files",
    {
      schema: {},
    },
    listFilesHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/files/:id",
    {
      schema: {},
    },
    getFileHandler,
  );
}
