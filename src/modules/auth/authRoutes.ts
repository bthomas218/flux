import type { FastifyInstance } from "fastify";
import { registerUser } from "./authController.js";

export async function authRoutes(app: FastifyInstance) {
  app.get("/register", registerUser);
}
