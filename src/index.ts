import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/health", async (request, reply) => {
  return { status: "OK" };
});

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
