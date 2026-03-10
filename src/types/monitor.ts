import type { TrafficIncident } from "./traffic";

export interface JourneyMonitorStatus {
  journeyId: string;
  journeyName: string;
  incidents: TrafficIncident[];
  lastChecked: string;
  currentDelayMinutes: number;
  status: "clear" | "minor_delays" | "major_delays" | "blocked";
}

export interface JourneyMonitorConfig {
  enabled: boolean;
  intervalMs: number;
  notifyOnNewIncidents: boolean;
  notifyOnDelayThresholdMinutes: number;
}
