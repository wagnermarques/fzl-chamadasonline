import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../lib/env.js";

export interface JwtPayload {
  sub: string; // user id
  role: "STUDENT" | "STAFF";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireStaff: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: "12h" },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "unauthorized" });
    }
  });

  app.decorate("requireStaff", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "unauthorized" });
      return;
    }
    if (request.user.role !== "STAFF") {
      reply.code(403).send({ error: "forbidden" });
    }
  });
});
