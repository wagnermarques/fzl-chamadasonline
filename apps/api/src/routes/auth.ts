import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { loginSchema } from "@chamadas/shared";
import { prisma } from "../lib/prisma.js";
import { upsertDevice, bindDeviceIfUnbound } from "../lib/device.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
      }
      const { identifier, pin, clientToken } = parsed.data;

      const user = await prisma.user.findFirst({
        where: { OR: [{ registrationNumber: identifier }, { email: identifier }] },
      });
      if (!user) {
        return reply.code(401).send({ error: "invalid_credentials" });
      }

      const pinMatches = await bcrypt.compare(pin, user.pinHash);
      if (!pinMatches) {
        return reply.code(401).send({ error: "invalid_credentials" });
      }

      const device = await upsertDevice(clientToken);
      await bindDeviceIfUnbound(device.id, user.id);

      const accessToken = app.jwt.sign({ sub: user.id, role: user.role });

      return reply.send({
        accessToken,
        user: { id: user.id, name: user.name, role: user.role },
      });
    },
  );

  app.get("/auth/me", { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) return reply.code(404).send({ error: "not_found" });
    return reply.send({ id: user.id, name: user.name, role: user.role });
  });
}
