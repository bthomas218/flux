import Fastify from "fastify";
import { cfg } from "./cfg.js";

const app = Fastify({
  logger: true,
});

app.get("/health", async (request, reply) => {
  return { status: "OK" };
});

async function main() {
  try {
    await app.listen({ port: cfg.PORT, host: cfg.HOSTNAME });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
