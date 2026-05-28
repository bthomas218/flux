import type { FastifyReply, FastifyRequest } from "fastify";
import { BadRequestError } from "../../errors.js";
import { uploadFileService } from "./filesService.js";

// TODO: Implement file upload logic
export const uploadFileHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.isMultipart()) {
    throw new BadRequestError("Request is not multipart/form-data");
  }

  const data = await request.file();

  if (!data) {
    throw new BadRequestError("No file provided in the request");
  }

  const userId = request.apiKey!.userId;
  const { file, filename, mimetype } = data;

  const uploadedFile = await uploadFileService(
    userId,
    file,
    filename,
    mimetype,
  );

  reply.send(uploadedFile);
};

// TODO: Implement file retrieval logic
export const getFileHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.send({ message: "Get file endpoint is not yet implemented." });
};

// TODO: Implement file listing logic
export const listFilesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.send({ message: "List files endpoint is not yet implemented." });
};
