import type { Location, JourneyPreferences, RouteOption } from "./journey";
import type { TrafficIncident, TrafficSummaryData } from "./traffic";
import type { MapBounds } from "./map";

export interface AgentJourneyRequest {
  origin: Location;
  destination: Location;
  departureTime?: string;
  preferences?: JourneyPreferences;
}

export interface AgentJourneyResponse {
  routes: RouteOption[];
  trafficIncidents: TrafficIncident[];
  summary: string;
  recommendations: string[];
  timestamp: string;
}

export interface AgentTrafficRequest {
  bounds: MapBounds;
  zoom?: number;
}

export interface AgentTrafficResponse {
  incidents: TrafficIncident[];
  summary: TrafficSummaryData;
  timestamp: string;
}
