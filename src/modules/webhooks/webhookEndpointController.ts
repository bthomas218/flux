import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../../errors.js";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookEndpoints,
} from "./webhookEndpointService.js";
import type {
  CreateWebhookEndpointBody,
  CreateWebhookEndpointReply,
  DeleteWebhookEndpointParams,
  DeleteWebhookEndpointReply,
  ListWebhookEndpointsReply,
} from "./webhookEndpointSchemas.js";

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

export const createWebhookEndpointHandler = async (
  request: FastifyRequest<{
    Body: CreateWebhookEndpointBody;
  }>,
  reply: FastifyReply<{ Reply: CreateWebhookEndpointReply }>,
) => {
  const user = getAuthenticatedUser(request);
  const endpoint = await createWebhookEndpoint(user.userId, request.body.url);

  reply.status(201).send(endpoint);
};

export const listWebhookEndpointsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply<{ Reply: ListWebhookEndpointsReply }>,
) => {
  const user = getAuthenticatedUser(request);

  reply.send(await listWebhookEndpoints(user.userId));
};

export const deleteWebhookEndpointHandler = async (
  request: FastifyRequest<{
    Params: DeleteWebhookEndpointParams;
  }>,
  reply: FastifyReply<{ Reply: DeleteWebhookEndpointReply }>,
) => {
  const user = getAuthenticatedUser(request);

  reply.send(await deleteWebhookEndpoint(user.userId, request.params.id));
};
