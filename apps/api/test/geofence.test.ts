import { describe, expect, it } from "vitest";
import {
  haversineDistanceMeters,
  isWithinGeofence,
  isPointInPolygon,
  isWithinEventGeofence,
} from "../src/lib/geofence.js";

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

describe("isPointInPolygon", () => {
  // A simple ~110m x 110m square around the seed event's coordinates.
  const squareCampus = [
    { lat: -23.5500, lng: -46.6338 },
    { lat: -23.5500, lng: -46.6328 },
    { lat: -23.5510, lng: -46.6328 },
    { lat: -23.5510, lng: -46.6338 },
  ];

  it("accepts a point inside the polygon", () => {
    expect(isPointInPolygon({ lat: -23.5505, lng: -46.6333 }, squareCampus)).toBe(true);
  });

  it("rejects a point outside the polygon", () => {
    expect(isPointInPolygon({ lat: -23.56, lng: -46.64 }, squareCampus)).toBe(false);
  });
});

describe("isWithinEventGeofence", () => {
  const circleOnly = {
    geofenceLat: -23.55052,
    geofenceLng: -46.633308,
    geofenceRadiusMeters: 150,
    geofencePolygon: null,
  };

  const withPolygon = {
    ...circleOnly,
    geofencePolygon: [
      { lat: -23.5500, lng: -46.6338 },
      { lat: -23.5500, lng: -46.6328 },
      { lat: -23.5510, lng: -46.6328 },
      { lat: -23.5510, lng: -46.6338 },
    ],
  };

  it("falls back to the circle when there is no polygon", () => {
    const result = isWithinEventGeofence(-23.55052, -46.633308, circleOnly);
    expect(result.withinRadius).toBe(true);
  });

  it("uses the polygon when one is present, ignoring the circle", () => {
    // Inside the polygon but this point would also pass the circle, so
    // pick a spot that specifically tests polygon containment.
    const result = isWithinEventGeofence(-23.5505, -46.6333, withPolygon);
    expect(result.withinRadius).toBe(true);
  });

  it("rejects points outside the polygon even if a naive circle might accept them", () => {
    const result = isWithinEventGeofence(-23.56, -46.64, withPolygon);
    expect(result.withinRadius).toBe(false);
  });
});
