import { useEffect, useRef } from "react";
import {
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
} from "@fluentui/react-components";
import { env } from "../config/env";
import { useNotificationContext } from "../context/NotificationContext";
import { azureOpenAIService } from "../services/azureOpenAIService";
import { POLLING_INTERVALS } from "../utils/constants";
import type { SavedJourney } from "../types/journey";
import type { TrafficIncident } from "../types/traffic";
import type { JourneyMonitorStatus } from "../types/monitor";
import { v4 as uuidv4 } from "uuid";

const CORRIDOR_BUFFER = 0.02;

function computeCorridorBounds(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
) {
  return {
    north: Math.max(originLat, destLat) + CORRIDOR_BUFFER,
    south: Math.min(originLat, destLat) - CORRIDOR_BUFFER,
    east: Math.max(originLng, destLng) + CORRIDOR_BUFFER,
    west: Math.min(originLng, destLng) - CORRIDOR_BUFFER,
  };
}

function classifyStatus(
  incidents: TrafficIncident[]
): JourneyMonitorStatus["status"] {
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical"
  ).length;
  const highCount = incidents.filter((i) => i.severity === "high").length;

  if (criticalCount >= 2 || incidents.some((i) => i.type === "closure"))
    return "blocked";
  if (criticalCount >= 1 || highCount >= 3) return "major_delays";
  if (incidents.length > 0) return "minor_delays";
  return "clear";
}

async function fetchCorridorIncidents(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<TrafficIncident[]> {
  const key = env.azureMapsKey;
  const url = `https://atlas.microsoft.com/traffic/incident/detail/json?api-version=1.0&subscription-key=${key}&style=s3&boundingbox=${bounds.south},${bounds.west},${bounds.north},${bounds.east}&boundingZoom=12&trafficmodelid=-1&projection=EPSG4326&language=da-DK`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

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

  return pois
    .filter((poi) => !poi.cs || poi.cs === 0)
    .slice(0, 20)
    .map((poi) => ({
      id: poi.id || uuidv4(),
      title: poi.d || poi.c || "Traffic incident",
      description: [
        poi.d,
        poi.c,
        poi.f ? `From: ${poi.f}` : "",
        poi.t ? `To: ${poi.t}` : "",
      ]
        .filter(Boolean)
        .join(" - "),
      location: { lat: poi.p.y, lng: poi.p.x },
      severity: (poi.ty >= 4
        ? "critical"
        : poi.ty >= 3
          ? "high"
          : poi.ty >= 2
            ? "medium"
            : "low") as TrafficIncident["severity"],
      type: (poi.ic <= 1
        ? "accident"
        : poi.ic <= 6
          ? "other"
          : poi.ic <= 8
            ? "closure"
            : poi.ic === 9
              ? "roadwork"
              : "other") as TrafficIncident["type"],
      roadName: poi.r || "",
      delayMinutes: poi.dl ? Math.round(poi.dl / 60) : 0,
      source: "azure-maps" as const,
    }));
}

export function useJourneyMonitor(
  savedJourneys: SavedJourney[],
  toasterId?: string
) {
  const { addNotification } = useNotificationContext();
  const { dispatchToast } = useToastController(toasterId);
  const seenIncidentsRef = useRef<Map<string, Set<string>>>(new Map());
  const rerouteTriggeredRef = useRef<Set<string>>(new Set());
  const isFirstRunRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const journeysRef = useRef(savedJourneys);
  journeysRef.current = savedJourneys;

  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;
  const dispatchToastRef = useRef(dispatchToast);
  dispatchToastRef.current = dispatchToast;

  useEffect(() => {
    const checkJourneys = async () => {
      const journeys = journeysRef.current;
      if (journeys.length === 0) return;

      for (const journey of journeys) {
        const bounds = computeCorridorBounds(
          journey.origin.coordinates.lat,
          journey.origin.coordinates.lng,
          journey.destination.coordinates.lat,
          journey.destination.coordinates.lng
        );

        const incidents = await fetchCorridorIncidents(bounds);

        const journeyKey = journey.id;
        const previousIds = seenIncidentsRef.current.get(journeyKey) || new Set();
        const currentIds = new Set(incidents.map((i) => i.id));

        if (!isFirstRunRef.current) {
          const newIncidents = incidents.filter((i) => !previousIds.has(i.id));

          for (const incident of newIncidents) {
            const notifSeverity =
              incident.severity === "critical"
                ? "error" as const
                : incident.severity === "high"
                  ? "warning" as const
                  : "info" as const;

            addNotificationRef.current({
              id: uuidv4(),
              type: "traffic",
              title: `Alert: ${journey.name}`,
              body: `${incident.title} on ${incident.roadName || "your route"}`,
              timestamp: new Date().toISOString(),
              read: false,
              severity: notifSeverity,
              journeyId: journey.id,
            });

            if (toasterId) {
              dispatchToastRef.current(
                <Toast>
                  <ToastTitle>{journey.name}</ToastTitle>
                  <ToastBody>
                    {incident.title}
                    {incident.roadName ? ` — ${incident.roadName}` : ""}
                  </ToastBody>
                </Toast>,
                {
                  intent:
                    incident.severity === "critical"
                      ? "error"
                      : incident.severity === "high"
                        ? "warning"
                        : "info",
                }
              );
            }

            if (
              Notification.permission === "granted" &&
              (incident.severity === "critical" || incident.severity === "high")
            ) {
              new Notification(`TrafficIQ: ${journey.name}`, {
                body: incident.title,
                tag: `ti-${journey.id}-${incident.id}`,
              });
            }
          }

          // Auto-reroute suggestion when major delays or blocked status detected
          const status = classifyStatus(incidents);
          if (
            (status === "blocked" || status === "major_delays") &&
            !rerouteTriggeredRef.current.has(journeyKey)
          ) {
            rerouteTriggeredRef.current.add(journeyKey);
            const totalDelay = incidents.reduce((sum, i) => sum + (i.delayMinutes ?? 0), 0);

            // Generate AI-powered reroute analysis
            azureOpenAIService
              .analyzeReroute(journey, incidents, totalDelay)
              .then((analysis) => {
                addNotificationRef.current({
                  id: uuidv4(),
                  type: "journey",
                  title: `Reroute Suggested: ${journey.name}`,
                  body: analysis,
                  timestamp: new Date().toISOString(),
                  read: false,
                  severity: "warning",
                  journeyId: journey.id,
                });

                if (toasterId) {
                  dispatchToastRef.current(
                    <Toast>
                      <ToastTitle>Reroute Suggested: {journey.name}</ToastTitle>
                      <ToastBody>{analysis.slice(0, 120)}...</ToastBody>
                    </Toast>,
                    { intent: "warning" }
                  );
                }

                if (Notification.permission === "granted") {
                  new Notification(`TrafficIQ: Reroute — ${journey.name}`, {
                    body: analysis.slice(0, 200),
                    tag: `reroute-${journey.id}`,
                  });
                }
              })
              .catch((err) => console.error("[JourneyMonitor] Reroute analysis failed:", err));
          }

          // Clear reroute flag when conditions improve
          if (status === "clear" || status === "minor_delays") {
            rerouteTriggeredRef.current.delete(journeyKey);
          }
        }

        seenIncidentsRef.current.set(journeyKey, currentIds);
      }

      isFirstRunRef.current = false;
    };

    checkJourneys();
    intervalRef.current = setInterval(
      checkJourneys,
      POLLING_INTERVALS.JOURNEY_MONITOR
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toasterId]); // stable deps only — journeys read from ref
}

export { computeCorridorBounds, fetchCorridorIncidents, classifyStatus };
