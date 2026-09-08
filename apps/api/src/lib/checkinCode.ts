import { CODE_ROTATION_SECONDS } from "@chamadas/shared";
import { prisma } from "./prisma.js";
import { generateCode } from "./codeGenerator.js";

const CODE_LENGTH = 5;

/**
 * Returns the currently active code for a period, generating a new one if the
 * previous one has expired (rotation happens lazily, on read, rather than via
 * a background timer).
 */
export async function getOrRotateCurrentCode(eventPeriodId: string) {
  const now = new Date();
  const latest = await prisma.checkinCode.findFirst({
    where: { eventPeriodId },
    orderBy: { issuedAt: "desc" },
  });

  if (latest && latest.expiresAt > now) {
    return latest;
  }

  return prisma.checkinCode.create({
    data: {
      eventPeriodId,
      code: generateCode(CODE_LENGTH),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + CODE_ROTATION_SECONDS * 1000),
    },
  });
}

/**
 * A submitted code is valid if it matches the current code, or the
 * immediately preceding one (grace window for projector/typing lag).
 */
export async function isCodeValidForPeriod(eventPeriodId: string, submittedCode: string) {
  const normalized = submittedCode.trim().toUpperCase();
  const recentCodes = await prisma.checkinCode.findMany({
    where: { eventPeriodId },
    orderBy: { issuedAt: "desc" },
    take: 2,
  });

  const now = new Date();
  return recentCodes.some(
    (c) => c.code === normalized && c.expiresAt.getTime() + CODE_ROTATION_SECONDS * 1000 > now.getTime(),
  );
}
