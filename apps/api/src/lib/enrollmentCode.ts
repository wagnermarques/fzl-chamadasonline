import { ENROLLMENT_CODE_LENGTH, ENROLLMENT_CODE_TTL_SECONDS } from "@chamadas/shared";
import { prisma } from "./prisma.js";
import { generateCode } from "./codeGenerator.js";

/** Staff generates a short-lived code for a specific student, shown on the staff screen. */
export async function createEnrollmentCode(studentId: string, staffId: string) {
  const now = new Date();
  return prisma.deviceEnrollmentCode.create({
    data: {
      studentId,
      issuedByStaffId: staffId,
      code: generateCode(ENROLLMENT_CODE_LENGTH),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ENROLLMENT_CODE_TTL_SECONDS * 1000),
    },
  });
}

/**
 * Validates and consumes a code entered by the student on their own device.
 * The code must belong to this exact student (a code issued for student A
 * can't be used to enroll a device as student B), be unexpired, and unused.
 */
export async function consumeEnrollmentCode(studentId: string, submittedCode: string) {
  const normalized = submittedCode.trim().toUpperCase();
  const now = new Date();

  const match = await prisma.deviceEnrollmentCode.findFirst({
    where: { studentId, code: normalized, usedAt: null, expiresAt: { gt: now } },
    orderBy: { issuedAt: "desc" },
  });
  if (!match) return null;

  await prisma.deviceEnrollmentCode.update({ where: { id: match.id }, data: { usedAt: now } });
  return match;
}
