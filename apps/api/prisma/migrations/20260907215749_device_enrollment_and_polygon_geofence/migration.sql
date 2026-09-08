-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByStaffId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "geofencePolygon" JSONB;

-- CreateTable
CREATE TABLE "DeviceEnrollmentCode" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedByStaffId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceEnrollmentCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceEnrollmentCode_studentId_expiresAt_idx" ON "DeviceEnrollmentCode"("studentId", "expiresAt");

-- CreateIndex
CREATE INDEX "Device_studentId_verified_idx" ON "Device"("studentId", "verified");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_verifiedByStaffId_fkey" FOREIGN KEY ("verifiedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceEnrollmentCode" ADD CONSTRAINT "DeviceEnrollmentCode_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceEnrollmentCode" ADD CONSTRAINT "DeviceEnrollmentCode_issuedByStaffId_fkey" FOREIGN KEY ("issuedByStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
