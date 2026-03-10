import type { Coordinates } from "./map";
import type { TrafficIncident } from "./traffic";

export interface Location {
  coordinates: Coordinates;
  label: string;
  address?: string;
}

export type TransportMode = "car" | "transit" | "bicycle" | "walk";

export interface JourneyPreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  transportMode: TransportMode;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMinutes: number;
  maneuver: string;
  roadName?: string;
  coordinates: [number, number];
}

export interface RouteOption {
  id: string;
  summary: string;
  durationMinutes: number;
  durationInTrafficMinutes: number;
  distanceKm: number;
  departureTime: string;
  arrivalTime: string;
  coordinates: [number, number][];
  steps: RouteStep[];
  trafficDelayMinutes: number;
  incidents: TrafficIncident[];
  isRecommended: boolean;
}

export interface MorningAlertConfig {
  enabled: boolean;
  time: string;
  daysOfWeek: number[];
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface SavedJourney {
  id: string;
  name: string;
  origin: Location;
  destination: Location;
  preferences: JourneyPreferences;
  morningAlert: MorningAlertConfig | null;
  createdAt: string;
  lastUsedAt?: string;
}
