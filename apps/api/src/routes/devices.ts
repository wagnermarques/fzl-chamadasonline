import type { FastifyInstance } from "fastify";
import { enrollDeviceSchema } from "@chamadas/shared";
import { prisma } from "../lib/prisma.js";
import { createEnrollmentCode, consumeEnrollmentCode } from "../lib/enrollmentCode.js";
import { enrollVerifiedDevice, getVerifiedDeviceForStudent } from "../lib/device.js";

export default async function deviceRoutes(app: FastifyInstance) {
  // Staff: look up a student by RM (matrícula) at the secretaria desk, and
  // see whether they already have a verified device on file.
  app.get("/students/lookup", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const { registrationNumber } = request.query as { registrationNumber?: string };
    if (!registrationNumber) {
      return reply.code(400).send({ error: "registration_number_required" });
    }

    const student = await prisma.user.findFirst({
      where: { role: "STUDENT", registrationNumber },
    });
    if (!student) return reply.code(404).send({ error: "student_not_found" });

    const verifiedDevice = await getVerifiedDeviceForStudent(student.id);
    return reply.send({
      student: { id: student.id, name: student.name, registrationNumber: student.registrationNumber },
      verifiedDevice: verifiedDevice
        ? { verifiedAt: verifiedDevice.verifiedAt }
        : null,
    });
  });

  // Staff: list all students who have an enrolled / verified device
  app.get("/devices/enrolled", { onRequest: [app.requireStaff] }, async (_request, reply) => {
    const devices = await prisma.device.findMany({
      where: { verified: true, studentId: { not: null } },
      include: { student: true },
      orderBy: { verifiedAt: "desc" },
    });

    const list = devices.map((d) => ({
      deviceId: d.id,
      clientToken: d.clientToken,
      studentId: d.studentId,
      studentName: d.student?.name ?? "",
      registrationNumber: d.student?.registrationNumber ?? "",
      email: d.student?.email ?? "",
      verifiedAt: d.verifiedAt?.toISOString() ?? null,
      lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
    }));

    return reply.send({ devices: list, total: list.length });
  });

  // Staff: unlink an enrolled device
  app.post("/devices/:id/unlink", { onRequest: [app.requireStaff] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.device.updateMany({
      where: { OR: [{ id }, { studentId: id }] },
      data: { verified: false, verifiedAt: null, verifiedByStaffId: null },
    });
    return reply.send({ status: "ok" });
  });

  // Staff: generate a short-lived code for this student, shown on the staff
  // screen while the student is present at the secretaria with their phone.
  app.post(
    "/students/:id/enrollment-code",
    { onRequest: [app.requireStaff], config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const student = await prisma.user.findUnique({ where: { id } });
      if (!student || student.role !== "STUDENT") {
        return reply.code(404).send({ error: "student_not_found" });
      }

      const enrollmentCode = await createEnrollmentCode(id, request.user.sub);
      return reply.send({ code: enrollmentCode.code, expiresAt: enrollmentCode.expiresAt });
    },
  );

  // Student, on their own phone: enters the code shown on the staff screen
  // to make *this* device the verified one for their account.
  app.post(
    "/devices/enroll",
    { onRequest: [app.authenticate], config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      if (request.user.role !== "STUDENT") {
        return reply.code(403).send({ error: "forbidden" });
      }

      const parsed = enrollDeviceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
      }
      const { code, clientToken, fingerprintHash } = parsed.data;
      const studentId = request.user.sub;

      const enrollmentCode = await consumeEnrollmentCode(studentId, code);
      if (!enrollmentCode) {
        return reply.code(400).send({ error: "invalid_or_expired_code" });
      }

      await enrollVerifiedDevice({
        studentId,
        staffId: enrollmentCode.issuedByStaffId,
        clientToken,
        fingerprintHash,
      });

      return reply.send({ status: "ok" });
    },
  );
}
