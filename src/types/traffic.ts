import type { Coordinates } from "./map";

export type IncidentType =
  | "accident"
  | "roadwork"
  | "congestion"
  | "closure"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type CongestionLevel =
  | "free"
  | "light"
  | "moderate"
  | "heavy"
  | "severe";

export interface TrafficIncident {
  id: string;
  type: IncidentType;
  severity: Severity;
  title: string;
  description: string;
  location: Coordinates;
  roadName?: string;
  startTime?: string;
  endTime?: string;
  delayMinutes?: number;
  source: "vejdirektoratet" | "azure-maps" | "agent";
}

export interface TrafficSummaryData {
  totalIncidents: number;
  criticalIncidents: number;
  averageDelay: number;
  congestionLevel: CongestionLevel;
  lastUpdated: string;
}
