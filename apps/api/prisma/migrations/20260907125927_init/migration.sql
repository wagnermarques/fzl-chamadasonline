-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'STAFF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "registrationNumber" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "geofenceLat" DOUBLE PRECISION NOT NULL,
    "geofenceLng" DOUBLE PRECISION NOT NULL,
    "geofenceRadiusMeters" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPeriod" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckinCode" (
    "id" TEXT NOT NULL,
    "eventPeriodId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckinCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "clientToken" TEXT NOT NULL,
    "studentId" TEXT,
    "fingerprintHash" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "eventPeriodId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationNumber_key" ON "User"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "EventPeriod_eventId_idx" ON "EventPeriod"("eventId");

-- CreateIndex
CREATE INDEX "CheckinCode_eventPeriodId_expiresAt_idx" ON "CheckinCode"("eventPeriodId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_clientToken_key" ON "Device"("clientToken");

-- CreateIndex
CREATE INDEX "Device_fingerprintHash_idx" ON "Device"("fingerprintHash");

-- CreateIndex
CREATE INDEX "Checkin_eventPeriodId_idx" ON "Checkin"("eventPeriodId");

-- CreateIndex
CREATE INDEX "Checkin_flagged_idx" ON "Checkin"("flagged");

-- CreateIndex
CREATE UNIQUE INDEX "Checkin_studentId_eventPeriodId_key" ON "Checkin"("studentId", "eventPeriodId");

-- AddForeignKey
ALTER TABLE "EventPeriod" ADD CONSTRAINT "EventPeriod_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinCode" ADD CONSTRAINT "CheckinCode_eventPeriodId_fkey" FOREIGN KEY ("eventPeriodId") REFERENCES "EventPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_eventPeriodId_fkey" FOREIGN KEY ("eventPeriodId") REFERENCES "EventPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
