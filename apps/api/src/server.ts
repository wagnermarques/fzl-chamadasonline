import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import checkinRoutes from "./routes/checkins.js";
import deviceRoutes from "./routes/devices.js";
import { env } from "./lib/env.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.allowedOrigins });
await app.register(rateLimit, { global: false });
await app.register(authPlugin);

app.get("/health", async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(eventRoutes);
await app.register(checkinRoutes);
await app.register(deviceRoutes);

app
  .listen({ port: env.port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
