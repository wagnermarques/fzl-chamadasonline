import { FLAG_REASONS } from "@chamadas/shared";
import { prisma } from "./prisma.js";

/**
 * Finds or creates the Device row for this browser's persistent clientToken.
 * The first student to check in from a device "owns" it going forward.
 */
export async function upsertDevice(clientToken: string, fingerprintHash?: string) {
  return prisma.device.upsert({
    where: { clientToken },
    update: fingerprintHash ? { fingerprintHash } : {},
    create: { clientToken, fingerprintHash },
  });
}

interface DeviceFlagInput {
  deviceId: string;
  deviceStudentId: string | null;
  fingerprintHash: string | null;
  requestingStudentId: string;
}

/**
 * Soft-fraud checks around device reuse. Never blocks the check-in — a
 * device change can be entirely legitimate (new phone, reinstalled PWA) —
 * only flags it for staff review.
 */
export async function computeDeviceFlags({
  deviceId,
  deviceStudentId,
  fingerprintHash,
  requestingStudentId,
}: DeviceFlagInput): Promise<string[]> {
  const reasons: string[] = [];

  if (deviceStudentId && deviceStudentId !== requestingStudentId) {
    reasons.push(FLAG_REASONS.DEVICE_BOUND_TO_OTHER_STUDENT);
  }

  if (fingerprintHash) {
    const similarDeviceForOtherStudent = await prisma.device.findFirst({
      where: {
        fingerprintHash,
        id: { not: deviceId },
        studentId: { not: null, notIn: [requestingStudentId] },
      },
    });
    if (similarDeviceForOtherStudent) {
      reasons.push(FLAG_REASONS.SIMILAR_FINGERPRINT_MULTIPLE_STUDENTS);
    }
  }

  return reasons;
}

/** Binds a device to a student the first time it's used, if not already bound. */
export async function bindDeviceIfUnbound(deviceId: string, studentId: string) {
  await prisma.device.updateMany({
    where: { id: deviceId, studentId: null },
    data: { studentId },
  });
}
