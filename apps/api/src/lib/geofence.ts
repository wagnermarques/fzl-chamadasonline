import type { LatLng } from "@chamadas/shared";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineDistanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));

  return EARTH_RADIUS_METERS * c;
}

export function isWithinGeofence(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): { withinRadius: boolean; distanceMeters: number } {
  const distanceMeters = haversineDistanceMeters(pointLat, pointLng, centerLat, centerLng);
  return { withinRadius: distanceMeters <= radiusMeters, distanceMeters };
}

/**
 * Ray-casting point-in-polygon test. Treats lat/lng as flat x/y, which is
 * accurate enough at the scale of a single school campus (no need for
 * proper geodesic polygon math over such a small area).
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat;
    const xi = polygon[i].lng;
    const yj = polygon[j].lat;
    const xj = polygon[j].lng;

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function centroid(polygon: LatLng[]): LatLng {
  const sum = polygon.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / polygon.length, lng: sum.lng / polygon.length };
}

interface EventGeofence {
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadiusMeters: number;
  geofencePolygon: LatLng[] | null;
}

/**
 * Checks a point against an event's geofence: the precise polygon when the
 * school has one on file, falling back to the simple lat/lng/radius circle
 * otherwise. distanceMeters is always the distance to the reference center
 * (polygon centroid, or the circle's center) — informative for staff review
 * even in polygon mode, though the pass/fail there comes from containment,
 * not the distance.
 */
export function isWithinEventGeofence(
  pointLat: number,
  pointLng: number,
  event: EventGeofence,
): { withinRadius: boolean; distanceMeters: number } {
  if (event.geofencePolygon && event.geofencePolygon.length >= 3) {
    const center = centroid(event.geofencePolygon);
    return {
      withinRadius: isPointInPolygon({ lat: pointLat, lng: pointLng }, event.geofencePolygon),
      distanceMeters: haversineDistanceMeters(pointLat, pointLng, center.lat, center.lng),
    };
  }
  return isWithinGeofence(
    pointLat,
    pointLng,
    event.geofenceLat,
    event.geofenceLng,
    event.geofenceRadiusMeters,
  );
}
