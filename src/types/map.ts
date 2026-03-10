export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// --- Reachable Range (Isochrone) ---

export interface ReachableRange {
  center: Coordinates;
  boundary: Coordinates[];
  timeBudgetMinutes?: number;
  fuelBudgetLiters?: number;
  distanceBudgetKm?: number;
  travelMode: "car" | "truck";
}

// --- Points of Interest ---

export type POICategory =
  | "gas_station"
  | "rest_area"
  | "truck_stop"
  | "repair_shop"
  | "parking"
  | "restaurant"
  | "hospital";

export interface PointOfInterest {
  id: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates;
  address: string;
  phone?: string;
  distanceMeters?: number;
  detourTimeSeconds?: number;
}

// --- Weather ---

export interface WeatherDayForecast {
  date: string;
  iconPhrase: string;
  iconCode: number;
  temperatureMin: number;
  temperatureMax: number;
  windSpeed: number;
  windDirection: string;
  precipitationProbability: number;
  precipitationType: string;
  hasPrecipitation: boolean;
  cloudCover: number;
  uvIndex: number;
}

export interface LocationWeather {
  location: Coordinates;
  locationLabel: string;
  forecasts: WeatherDayForecast[];
  current?: WeatherDayForecast;
}

// --- Snapped GPS Position ---

export interface SnappedPosition {
  original: Coordinates;
  snapped: Coordinates;
  roadName?: string;
  speedLimitKmh?: number;
}

// --- Truck Route Comparison ---

export interface RouteComparisonEntry {
  travelMode: "car" | "truck";
  durationMinutes: number;
  durationInTrafficMinutes: number;
  distanceKm: number;
  trafficDelayMinutes: number;
  coordinates: [number, number][];
}

export interface TruckRouteComparison {
  carRoute: RouteComparisonEntry;
  truckRoute: RouteComparisonEntry;
  timeDifferenceMinutes: number;
  distanceDifferenceKm: number;
  restrictions: string[];
}
