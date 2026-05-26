import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../../errors.js";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "./apiKeyService.js";
import type {
  CreateApiKeyBody,
  CreateApiKeyReply,
  DeleteApiKeyParams,
  DeleteApiKeyReply,
  ListApiKeysReply,
} from "./apiKeySchemas.js";

type JwtUser = {
  userId: string;
  email: string;
};

function getAuthenticatedUser(request: FastifyRequest) {
  const user = request.user as Partial<JwtUser> | undefined;

  if (!user?.userId) {
    throw new UnauthorizedError();
  }

  return user as JwtUser;
}

export const createApiKeyHandler = async (
  request: FastifyRequest<{
    Body: CreateApiKeyBody;
  }>,
  reply: FastifyReply<{ Reply: CreateApiKeyReply }>,
) => {
  const user = getAuthenticatedUser(request);
  const apiKey = await createApiKey(user.userId, request.body.name);

  reply.status(201).send(apiKey);
};

export const listApiKeysHandler = async (
  request: FastifyRequest,
  reply: FastifyReply<{ Reply: ListApiKeysReply }>,
) => {
  const user = getAuthenticatedUser(request);

  reply.send(await listApiKeys(user.userId));
};

export const deleteApiKeyHandler = async (
  request: FastifyRequest<{
    Params: DeleteApiKeyParams;
  }>,
  reply: FastifyReply<{ Reply: DeleteApiKeyReply }>,
) => {
  const user = getAuthenticatedUser(request);

  reply.send(await revokeApiKey(user.userId, request.params.id));
};
