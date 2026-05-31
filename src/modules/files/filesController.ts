import type { FastifyReply, FastifyRequest } from "fastify";
import { BadRequestError } from "../../errors.js";
import {
  getFile,
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
} from "./filesService.js";
import type {
  GetFileReply,
  UploadFileReply,
  GetFileParams,
  ListFilesReply,
  DeleteFileReply,
} from "./filesSchemas.js";

export const uploadFileHandler = async (
  request: FastifyRequest,
  reply: FastifyReply<{ Reply: UploadFileReply }>,
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

  const uploadedFile = await uploadFile(userId, file, filename, mimetype);

  reply.send(uploadedFile);
};

export const getFileHandler = async (
  request: FastifyRequest<{ Params: GetFileParams }>,
  reply: FastifyReply<{ Reply: GetFileReply }>,
) => {
  const userId = request.apiKey!.userId;
  const { id } = request.params as { id: string };

  const file = await getFile(id, userId);
  reply.send(file);
};

export const listFilesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply<{ Reply: ListFilesReply }>,
) => {
  const userId = request.apiKey!.userId;
  const files = await listFiles(userId);
  reply.send(files);
};

export const downloadFileHandler = async (
  request: FastifyRequest<{ Params: GetFileParams }>,
  reply: FastifyReply,
) => {
  const userId = request.apiKey!.userId;
  const { id } = request.params as { id: string };

  const { stream, filename, mimeType, size } = await downloadFile(id, userId);

  const safeFilename = filename.replace(/["\\\r\n]/g, "_");

  reply
    .type(mimeType)
    .header("Content-Length", size.toString())
    .header(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

  return reply.send(stream);
};

export const deleteFileHandler = async (
  request: FastifyRequest<{ Params: GetFileParams }>,
  reply: FastifyReply<{ Reply: DeleteFileReply }>,
) => {
  const userId = request.apiKey!.userId;
  const { id } = request.params as { id: string };

  reply.send(await deleteFile(id, userId));
};
