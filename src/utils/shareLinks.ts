import type { TransportMode } from "../types/journey";

export interface ShareableRoute {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  waypoints?: { lat: number; lng: number; label: string }[];
  transportMode?: TransportMode;
}

export type ShareTarget = "google" | "apple" | "waze" | "clipboard";

const googleModeMap: Record<TransportMode, string> = {
  car: "driving",
  transit: "transit",
  bicycle: "bicycling",
  walk: "walking",
};

const appleModeMap: Record<TransportMode, string> = {
  car: "d",
  transit: "r",
  bicycle: "w",
  walk: "w",
};

export function generateGoogleMapsUrl(route: ShareableRoute): string {
  const mode = googleModeMap[route.transportMode || "car"];
  let url = `https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}&travelmode=${mode}`;
  if (route.waypoints && route.waypoints.length > 0) {
    const wp = route.waypoints.map((w) => `${w.lat},${w.lng}`).join("|");
    url += `&waypoints=${wp}`;
  }
  return url;
}

export function generateAppleMapsUrl(route: ShareableRoute): string {
  const dirflg = appleModeMap[route.transportMode || "car"];
  return `https://maps.apple.com/?saddr=${route.origin.lat},${route.origin.lng}&daddr=${route.destination.lat},${route.destination.lng}&dirflg=${dirflg}`;
}

export function generateWazeUrl(route: ShareableRoute): string {
  return `https://waze.com/ul?ll=${route.destination.lat},${route.destination.lng}&navigate=yes`;
}

export function getShareUrl(target: ShareTarget, route: ShareableRoute): string {
  switch (target) {
    case "google":
      return generateGoogleMapsUrl(route);
    case "apple":
      return generateAppleMapsUrl(route);
    case "waze":
      return generateWazeUrl(route);
    case "clipboard":
      return generateGoogleMapsUrl(route);
  }
}

export async function copyRouteToClipboard(route: ShareableRoute): Promise<void> {
  const stops = route.waypoints && route.waypoints.length > 0
    ? `${route.origin.label} → ${route.waypoints.map((w) => w.label).join(" → ")} → ${route.destination.label}`
    : `${route.origin.label} → ${route.destination.label}`;
  const text = `${stops}\nGoogle Maps: ${generateGoogleMapsUrl(route)}`;
  await navigator.clipboard.writeText(text);
}
