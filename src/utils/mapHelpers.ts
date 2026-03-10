import type { MapBounds, Coordinates } from "../types/map";

export function coordinatesToPosition(
  coords: Coordinates
): [number, number] {
  return [coords.lng, coords.lat];
}

export function positionToCoordinates(
  position: [number, number]
): Coordinates {
  return { lng: position[0], lat: position[1] };
}

export function boundsContain(
  bounds: MapBounds,
  coords: Coordinates
): boolean {
  return (
    coords.lat >= bounds.south &&
    coords.lat <= bounds.north &&
    coords.lng >= bounds.west &&
    coords.lng <= bounds.east
  );
}

export function expandBounds(
  bounds: MapBounds,
  factor: number = 0.1
): MapBounds {
  const latRange = (bounds.north - bounds.south) * factor;
  const lngRange = (bounds.east - bounds.west) * factor;
  return {
    north: bounds.north + latRange,
    south: bounds.south - latRange,
    east: bounds.east + lngRange,
    west: bounds.west - lngRange,
  };
}
