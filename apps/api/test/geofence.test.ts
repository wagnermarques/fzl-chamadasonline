import { describe, expect, it } from "vitest";
import { haversineDistanceMeters, isWithinGeofence } from "../src/lib/geofence.js";

describe("haversineDistanceMeters", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineDistanceMeters(-23.55052, -46.633308, -23.55052, -46.633308)).toBeCloseTo(0, 3);
  });

  it("returns a sane distance for two known points ~1.1km apart", () => {
    // Praça da Sé -> Parque Ibirapuera-ish offset, roughly 1.1km, sanity range only.
    const d = haversineDistanceMeters(-23.55052, -46.633308, -23.5605, -46.6433);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(2000);
  });
});

describe("isWithinGeofence", () => {
  it("flags points outside the radius", () => {
    const { withinRadius, distanceMeters } = isWithinGeofence(
      -23.5605,
      -46.6433,
      -23.55052,
      -46.633308,
      150,
    );
    expect(withinRadius).toBe(false);
    expect(distanceMeters).toBeGreaterThan(150);
  });

  it("accepts points within the radius", () => {
    const { withinRadius } = isWithinGeofence(-23.55052, -46.633308, -23.55052, -46.633308, 150);
    expect(withinRadius).toBe(true);
  });
});
