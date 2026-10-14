import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma";

const server = app.listen(env.PORT, () => {
  console.log(`Dernek API: http://127.0.0.1:${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
