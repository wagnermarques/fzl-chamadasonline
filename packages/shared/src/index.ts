import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1), // registrationNumber (student) or email (staff)
  pin: z.string().min(4).max(64),
  clientToken: z.string().uuid(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const keycloakLoginSchema = z.object({
  keycloakToken: z.string().min(1),
  clientToken: z.string().uuid(),
});
export type KeycloakLoginInput = z.infer<typeof keycloakLoginSchema>;

export const checkinSchema = z.object({
  eventPeriodId: z.string().uuid(),
  code: z.string().min(4).max(12),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  clientToken: z.string().uuid(),
  fingerprintHash: z.string().optional(),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type LatLng = z.infer<typeof latLngSchema>;

export const createEventSchema = z.object({
  name: z.string().min(1),
  date: z.string().datetime(),
  geofenceLat: z.number().min(-90).max(90),
  geofenceLng: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().positive().default(150),
  // Optional precise boundary of the school grounds; when present, takes
  // priority over the lat/lng/radius circle above.
  geofencePolygon: z.array(latLngSchema).min(3).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const createPeriodSchema = z.object({
  label: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;

export const FLAG_REASONS = {
  OUTSIDE_GEOFENCE: "outside_geofence",
  DEVICE_BOUND_TO_OTHER_STUDENT: "device_bound_to_other_student",
  SIMILAR_FINGERPRINT_MULTIPLE_STUDENTS: "similar_fingerprint_multiple_students",
} as const;
export type FlagReason = (typeof FLAG_REASONS)[keyof typeof FLAG_REASONS];

export const CODE_ROTATION_SECONDS = 45;
export const DEFAULT_GEOFENCE_RADIUS_METERS = 150;

export const enrollDeviceSchema = z.object({
  code: z.string().min(4).max(10),
  clientToken: z.string().uuid(),
  fingerprintHash: z.string().optional(),
});
export type EnrollDeviceInput = z.infer<typeof enrollDeviceSchema>;

export const ENROLLMENT_CODE_LENGTH = 6;
export const ENROLLMENT_CODE_TTL_SECONDS = 120;
