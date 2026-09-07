/**
 * Bulk-import students from a CSV file with header: registrationNumber,name
 * Default PIN = last 4 digits of the registration number (students are told
 * this PIN when handed their credentials; they are not expected to change it
 * for a single-day event).
 *
 * Usage: npm run import:students --workspace apps/api -- path/to/students.csv
 */
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function defaultPin(registrationNumber: string): string {
  return registrationNumber.slice(-4).padStart(4, "0");
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: import-students.ts <path-to-csv>");
    process.exit(1);
  }

  const lines = readFileSync(filePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const [header, ...rows] = lines;
  const columns = header.split(",").map((c) => c.trim());
  const regIdx = columns.indexOf("registrationNumber");
  const nameIdx = columns.indexOf("name");
  if (regIdx === -1 || nameIdx === -1) {
    throw new Error('CSV header must include "registrationNumber,name"');
  }

  let created = 0;
  for (const row of rows) {
    const cols = row.split(",");
    const registrationNumber = cols[regIdx]?.trim();
    const name = cols[nameIdx]?.trim();
    if (!registrationNumber || !name) continue;

    const pinHash = await bcrypt.hash(defaultPin(registrationNumber), 10);
    await prisma.user.upsert({
      where: { registrationNumber },
      update: { name },
      create: { role: "STUDENT", registrationNumber, name, pinHash },
    });
    created += 1;
  }

  console.log(`Imported ${created} students from ${filePath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
