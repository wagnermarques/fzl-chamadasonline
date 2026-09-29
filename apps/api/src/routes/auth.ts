import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { loginSchema, keycloakLoginSchema } from "@chamadas/shared";
import { prisma } from "../lib/prisma.js";
import { upsertDevice, bindDeviceIfUnbound } from "../lib/device.js";
import { env } from "../lib/env.js";
import { keycloakEnabled, verifyKeycloakToken, type KeycloakClaims } from "../lib/keycloak.js";

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

  app.post(
    "/auth/keycloak",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = keycloakLoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
      }
      const { keycloakToken, clientToken } = parsed.data;

      if (!keycloakEnabled) {
        return reply.code(503).send({ error: "keycloak_not_configured" });
      }

      let payload: KeycloakClaims;
      try {
        payload = await verifyKeycloakToken(keycloakToken);
      } catch (err) {
        request.log.warn({ err }, "keycloak token rejected");
        return reply.code(401).send({ error: "invalid_keycloak_token" });
      }

      const username = payload.preferred_username || payload.sub;
      if (!username) {
        return reply.code(401).send({ error: "invalid_keycloak_token" });
      }
      const name: string = payload.name || payload.preferred_username || "Aluno";
      const email: string | undefined = payload.email || undefined;
      const realmRoles: string[] = payload.realm_access?.roles || [];
      const clientRoles: string[] = payload.resource_access?.[env.keycloak.clientId]?.roles || [];
      const allRoles = [...realmRoles, ...clientRoles];

      // Verifica permissões necessárias
      const hasAccess = allRoles.some((r) =>
        ["chamadas-user", "chamadas-student", "chamadas-staff", "admin", "staff"].includes(r.toLowerCase()),
      );
      if (!hasAccess && allRoles.length > 0) {
        return reply.code(403).send({ error: "missing_chamadas_role" });
      }

      const isStaff = allRoles.some((r) =>
        ["chamadas-staff", "staff", "admin", "teacher"].includes(r.toLowerCase()),
      );

      // Localiza ou auto-provisiona o usuário no banco
      const findUser = () =>
        prisma.user.findFirst({
          where: { OR: [{ registrationNumber: username }, ...(email ? [{ email }] : [])] },
        });
      let user = await findUser();

      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              registrationNumber: username,
              name,
              email,
              role: isStaff ? "STAFF" : "STUDENT",
              pinHash: "", // Autenticação delegada ao Keycloak
            },
          });
        } catch (err) {
          // Duas requisições simultâneas no primeiro login (ex.: StrictMode,
          // duas abas): a outra já criou o usuário — reusa o registro dela.
          if ((err as { code?: string }).code !== "P2002") throw err;
          user = await findUser();
          if (!user) throw err;
        }
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            email: email || user.email,
            ...(isStaff && user.role !== "STAFF" ? { role: "STAFF" } : {}),
          },
        });
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
