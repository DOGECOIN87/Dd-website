import type { Location } from '../data/locations';

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusMiles = 3958.8;
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function distanceToLocations(position: { latitude: number; longitude: number }, locations: Location[]) {
  const user = { lat: position.latitude, lng: position.longitude };
  return Object.fromEntries(locations.map((location) => [location.id, milesBetween(user, location.coords)])) as Record<Location['id'], number>;
}
