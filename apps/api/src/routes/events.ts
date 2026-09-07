import type { FastifyInstance } from "fastify";
import { createEventSchema, createPeriodSchema } from "@chamadas/shared";
import { prisma } from "../lib/prisma.js";
import { getOrRotateCurrentCode } from "../lib/checkinCode.js";

export default async function eventRoutes(app: FastifyInstance) {
  // Staff: create an event
  app.post("/events", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const parsed = createEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const event = await prisma.event.create({ data: { ...parsed.data, date: new Date(parsed.data.date) } });
    return reply.code(201).send(event);
  });

  // Staff: add a period to an event
  app.post("/events/:id/periods", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = createPeriodSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const period = await prisma.eventPeriod.create({
      data: {
        eventId: id,
        label: parsed.data.label,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
      },
    });
    return reply.code(201).send(period);
  });

  // Student: the currently active event + period, if any
  app.get("/events/active", { onRequest: [app.authenticate] }, async (_request, reply) => {
    const now = new Date();
    const period = await prisma.eventPeriod.findFirst({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
      include: { event: true },
      orderBy: { startsAt: "desc" },
    });
    if (!period) return reply.send({ active: false });
    return reply.send({ active: true, event: period.event, period });
  });

  // Staff: projector view polls this for the current rotating code
  app.get(
    "/events/:eventId/periods/:periodId/code",
    { onRequest: [app.requireStaff] },
    async (request, reply) => {
      const { periodId } = request.params as { eventId: string; periodId: string };
      const current = await getOrRotateCurrentCode(periodId);
      const secondsRemaining = Math.max(
        0,
        Math.round((current.expiresAt.getTime() - Date.now()) / 1000),
      );
      return reply.send({ code: current.code, expiresAt: current.expiresAt, secondsRemaining });
    },
  );

  // Staff: live check-ins for a period
  app.get(
    "/events/:eventId/periods/:periodId/checkins",
    { onRequest: [app.requireStaff] },
    async (request, reply) => {
      const { periodId } = request.params as { eventId: string; periodId: string };
      const checkins = await prisma.checkin.findMany({
        where: { eventPeriodId: periodId },
        include: { student: { select: { id: true, name: true, registrationNumber: true } } },
        orderBy: { createdAt: "desc" },
      });
      return reply.send({ count: checkins.length, checkins });
    },
  );

  // Staff: flagged check-ins across an event, for manual review
  app.get("/events/:eventId/flagged", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const flagged = await prisma.checkin.findMany({
      where: { flagged: true, reviewed: false, eventPeriod: { eventId } },
      include: {
        student: { select: { id: true, name: true, registrationNumber: true } },
        eventPeriod: { select: { id: true, label: true } },
        device: { select: { id: true, clientToken: true, studentId: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ flagged });
  });

  // Staff: approve/reject a flagged check-in after review
  app.patch("/checkins/:id/review", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { decision } = request.body as { decision: "approved" | "rejected" };
    if (decision !== "approved" && decision !== "rejected") {
      return reply.code(400).send({ error: "invalid_decision" });
    }
    const checkin = await prisma.checkin.update({
      where: { id },
      data: { reviewed: true, reviewDecision: decision },
    });
    return reply.send(checkin);
  });
}
