export interface RouteHistoryEntry {
  id: string;
  journeyId?: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  durationMinutes: number;
  durationInTrafficMinutes: number;
  distanceKm: number;
  trafficDelayMinutes: number;
  incidentCount: number;
  departureTime: string;
  arrivalTime: string;
  summary: string;
  isRecommended: boolean;
  timestamp: string;
}
