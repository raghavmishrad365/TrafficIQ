import { useMutation, useQuery } from "@tanstack/react-query";
import { env } from "../config/env";
import type {
  AgentJourneyRequest,
  AgentJourneyResponse,
  AgentTrafficResponse,
} from "../types/agent";
import type { TrafficIncident } from "../types/traffic";
import type { RouteOption } from "../types/journey";
import type { MapBounds } from "../types/map";
import { POLLING_INTERVALS } from "../utils/constants";

async function fetchTrafficIncidents(
  bounds: MapBounds
): Promise<AgentTrafficResponse> {
  const key = env.azureMapsKey;
  // Required params: style, boundingbox (minLat,minLon,maxLat,maxLon for EPSG4326), boundingZoom, trafficmodelid
  const url = `https://atlas.microsoft.com/traffic/incident/detail/json?api-version=1.0&subscription-key=${key}&style=s3&boundingbox=${bounds.south},${bounds.west},${bounds.north},${bounds.east}&boundingZoom=12&trafficmodelid=-1&projection=EPSG4326&language=da-DK`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps traffic failed: ${res.statusText}`);
  const data = await res.json();

  // Response format: { tm: { poi: [...] } }
  // Each poi has: id, p (point {x,y}), ic (icon category), ty (delay magnitude),
  // d (description), c (cause), f (from), t (to), dl (delay seconds), r (road), cs (cluster size)
  const pois: Array<{
    id: string;
    p: { x: number; y: number };
    ic: number;
    ty: number;
    d?: string;
    c?: string;
    f?: string;
    t?: string;
    dl?: number;
    r?: string;
    cs?: number;
  }> = data.tm?.poi || [];

  // Filter out clusters (cs > 0 means it's a cluster)
  const incidents: TrafficIncident[] = pois
    .filter((poi) => !poi.cs || poi.cs === 0)
    .slice(0, 30)
    .map((poi) => ({
      id: poi.id || crypto.randomUUID(),
      title: poi.d || poi.c || "Traffic incident",
      description: [poi.d, poi.c, poi.f ? `From: ${poi.f}` : "", poi.t ? `To: ${poi.t}` : ""]
        .filter(Boolean)
        .join(" - "),
      location: {
        lat: poi.p.y,
        lng: poi.p.x,
      },
      severity:
        poi.ty >= 4
          ? "critical" as const
          : poi.ty >= 3
            ? "high" as const
            : poi.ty >= 2
              ? "medium" as const
              : "low" as const,
      type:
        poi.ic <= 1
          ? "accident" as const
          : poi.ic <= 6
            ? "other" as const
            : poi.ic <= 7
              ? "closure" as const
              : poi.ic <= 8
                ? "closure" as const
                : poi.ic === 9
                  ? "roadwork" as const
                  : "other" as const,
      roadName: poi.r || "",
      delayMinutes: poi.dl ? Math.round(poi.dl / 60) : 0,
      source: "azure-maps" as const,
    }));

  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical"
  ).length;
  const totalDelay = incidents.reduce(
    (sum, i) => sum + (i.delayMinutes ?? 0),
    0
  );
  const avgDelay = incidents.length > 0 ? totalDelay / incidents.length : 0;

  const congestionLevel =
    criticalIncidents >= 5
      ? "severe"
      : criticalIncidents >= 3
        ? "heavy"
        : incidents.length >= 10
          ? "moderate"
          : incidents.length >= 5
            ? "light"
            : "free";

  return {
    incidents,
    summary: {
      totalIncidents: incidents.length,
      criticalIncidents,
      averageDelay: Math.round(avgDelay),
      congestionLevel,
      lastUpdated: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
}

export function useTrafficOverview(bounds: MapBounds | null) {
  return useQuery<AgentTrafficResponse, Error>({
    queryKey: ["traffic", "overview", bounds],
    queryFn: () => fetchTrafficIncidents(bounds!),
    enabled: bounds !== null,
    refetchInterval: POLLING_INTERVALS.DASHBOARD_TRAFFIC,
  });
}

// --- Direct Azure Maps Route API ---

async function fetchJourneyRoutes(
  request: AgentJourneyRequest
): Promise<AgentJourneyResponse> {
  const key = env.azureMapsKey;
  const { origin, destination, departureTime, preferences } = request;
  const mode = preferences?.transportMode || "car";
  const travelMode = mode === "transit" ? "car" : mode;

  const avoid: string[] = [];
  if (preferences?.avoidTolls) avoid.push("tollRoads");
  if (preferences?.avoidHighways) avoid.push("motorways");
  const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join(",")}` : "";
  const departParam = departureTime ? `&departAt=${departureTime}` : "";

  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=${travelMode}&traffic=true&routeType=fastest&computeBestOrder=false&instructionsType=text${avoidParam}${departParam}&maxAlternatives=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();

  const routes: RouteOption[] = (data.routes || []).map(
    (
      route: {
        summary: {
          lengthInMeters: number;
          travelTimeInSeconds: number;
          trafficDelayInSeconds: number;
          departureTime: string;
          arrivalTime: string;
        };
        legs: {
          points: { latitude: number; longitude: number }[];
          steps: {
            instruction?: { text: string };
            routeOffsetInMeters: number;
            travelTimeInSeconds: number;
            maneuver: string;
            startPoint?: { latitude: number; longitude: number };
          }[];
        }[];
      },
      idx: number
    ) => {
      const leg = route.legs?.[0];
      const coordinates: [number, number][] = (leg?.points || []).map(
        (p: { latitude: number; longitude: number }) =>
          [p.longitude, p.latitude] as [number, number]
      );

      return {
        id: crypto.randomUUID(),
        summary: `Route ${idx + 1} via ${origin.label} to ${destination.label}`,
        durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
        durationInTrafficMinutes: Math.round(
          (route.summary.travelTimeInSeconds +
            route.summary.trafficDelayInSeconds) /
            60
        ),
        distanceKm:
          Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
        departureTime:
          route.summary.departureTime || new Date().toISOString(),
        arrivalTime: route.summary.arrivalTime || "",
        coordinates,
        steps: (leg?.steps || []).slice(0, 20).map(
          (step: {
            instruction?: { text: string };
            routeOffsetInMeters: number;
            travelTimeInSeconds: number;
            maneuver: string;
            startPoint?: { latitude: number; longitude: number };
          }) => ({
            instruction: step.instruction?.text || step.maneuver,
            distanceKm:
              Math.round((step.routeOffsetInMeters / 1000) * 10) / 10,
            durationMinutes: Math.round(step.travelTimeInSeconds / 60),
            maneuver: step.maneuver,
            coordinates: step.startPoint
              ? ([step.startPoint.longitude, step.startPoint.latitude] as [
                  number,
                  number,
                ])
              : ([0, 0] as [number, number]),
          })
        ),
        trafficDelayMinutes: Math.round(
          route.summary.trafficDelayInSeconds / 60
        ),
        incidents: [],
        isRecommended: idx === 0,
      };
    }
  );

  return {
    routes,
    trafficIncidents: [],
    summary: `Found ${routes.length} route(s) from ${origin.label} to ${destination.label}`,
    recommendations:
      routes.length > 1
        ? [
            `Route 1 is the fastest option with estimated ${routes[0].durationInTrafficMinutes} minutes in current traffic.`,
          ]
        : [],
    timestamp: new Date().toISOString(),
  };
}

export function usePlanJourney() {
  return useMutation<AgentJourneyResponse, Error, AgentJourneyRequest>({
    mutationFn: (request) => fetchJourneyRoutes(request),
  });
}
