import type { FastifyInstance } from "fastify";
import { checkinSchema, FLAG_REASONS, type LatLng } from "@chamadas/shared";
import { prisma } from "../lib/prisma.js";
import { isWithinEventGeofence } from "../lib/geofence.js";
import { isCodeValidForPeriod } from "../lib/checkinCode.js";
import { upsertDevice, computeDeviceFlags, getVerifiedDeviceForStudent } from "../lib/device.js";

export default async function checkinRoutes(app: FastifyInstance) {
  app.post(
    "/checkins",
    { onRequest: [app.authenticate], config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      if (request.user.role !== "STUDENT") {
        return reply.code(403).send({ error: "forbidden" });
      }

      const parsed = checkinSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
      }
      const { eventPeriodId, code, lat, lng, clientToken, fingerprintHash } = parsed.data;
      const studentId = request.user.sub;

      const period = await prisma.eventPeriod.findUnique({
        where: { id: eventPeriodId },
        include: { event: true },
      });
      if (!period) return reply.code(404).send({ error: "period_not_found" });

      const now = new Date();
      if (now < period.startsAt || now > period.endsAt) {
        return reply.code(400).send({ error: "period_not_active" });
      }

      const codeValid = await isCodeValidForPeriod(eventPeriodId, code);
      if (!codeValid) {
        return reply.code(400).send({ error: "invalid_or_expired_code" });
      }

      const existing = await prisma.checkin.findUnique({
        where: { studentId_eventPeriodId: { studentId, eventPeriodId } },
      });
      if (existing) {
        // Idempotent from the student's point of view: they already checked in.
        return reply.send({ status: "ok" });
      }

      // Once a student has a staff-verified device on file (secretaria
      // enrollment), only that device can check in for them — this is a
      // hard rejection, not a flag, since identity was already confirmed
      // in person.
      const verifiedDevice = await getVerifiedDeviceForStudent(studentId);
      if (verifiedDevice && verifiedDevice.clientToken !== clientToken) {
        request.log.warn(
          { studentId, expectedDeviceId: verifiedDevice.id },
          "checkin rejected: device does not match student's verified device",
        );
        return reply.code(403).send({ error: "device_not_enrolled" });
      }

      const device = await upsertDevice(clientToken, fingerprintHash);

      const { withinRadius, distanceMeters } = isWithinEventGeofence(lat, lng, {
        geofenceLat: period.event.geofenceLat,
        geofenceLng: period.event.geofenceLng,
        geofenceRadiusMeters: period.event.geofenceRadiusMeters,
        geofencePolygon: period.event.geofencePolygon as LatLng[] | null,
      });

      const deviceFlags = await computeDeviceFlags({
        deviceId: device.id,
        deviceStudentId: device.studentId,
        fingerprintHash: fingerprintHash ?? null,
        requestingStudentId: studentId,
      });

      const flagReasons = [...deviceFlags];
      if (!withinRadius) flagReasons.push(FLAG_REASONS.OUTSIDE_GEOFENCE);

      await prisma.checkin.create({
        data: {
          studentId,
          eventPeriodId,
          deviceId: device.id,
          lat,
          lng,
          distanceMeters,
          flagged: flagReasons.length > 0,
          flagReasons,
        },
      });

      // Always report success to the student, whether flagged or not — the
      // flag is only for staff review, and telling the student would tip
      // off anyone trying to game the system.
      return reply.send({ status: "ok" });
    },
  );
}
