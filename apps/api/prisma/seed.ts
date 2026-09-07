import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const staffPinHash = await bcrypt.hash("staff123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@escola.test" },
    update: {},
    create: {
      role: "STAFF",
      email: "staff@escola.test",
      name: "Coordenação",
      pinHash: staffPinHash,
    },
  });

  const studentPinHash = await bcrypt.hash("1234", 10);
  const student = await prisma.user.upsert({
    where: { registrationNumber: "20260001" },
    update: {},
    create: {
      role: "STUDENT",
      registrationNumber: "20260001",
      name: "Aluno Teste",
      pinHash: studentPinHash,
    },
  });

  // Sample event centered on the school (adjust lat/lng for real use).
  const event = await prisma.event.create({
    data: {
      name: "Semana Cultural 2026",
      date: new Date(),
      geofenceLat: -23.55052,
      geofenceLng: -46.633308,
      geofenceRadiusMeters: 150,
    },
  });

  const now = new Date();
  const period = await prisma.eventPeriod.create({
    data: {
      eventId: event.id,
      label: "Manhã - Abertura",
      startsAt: new Date(now.getTime() - 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    },
  });

  console.log({ staff: staff.email, student: student.registrationNumber, event: event.name, period: period.label });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
