import Fastify from "fastify";
import { cfg } from "./cfg.js";
import { authRoutes } from "./modules/auth/authRoutes.js";

const app = Fastify({
  logger:
    cfg.NODE_ENV === "development"
      ? {
          level: "debug",
          transport: {
            target: "pino-pretty",
          },
        }
      : {
          level: "info",
        },
});

app.get("/health", async (request, reply) => {
  return { status: "OK" };
});
app.register(authRoutes, { prefix: "auth" });

async function main() {
  try {
    await app.listen({ port: cfg.PORT, host: cfg.HOSTNAME });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
