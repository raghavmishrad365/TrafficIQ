import { isDemoModeEnabled } from "./demoMode";
import { env } from "../config/env";
import type {
  Coordinates,
  ReachableRange,
  PointOfInterest,
  POICategory,
  LocationWeather,
  WeatherDayForecast,
  SnappedPosition,
  TruckRouteComparison,
  RouteComparisonEntry,
} from "../types/map";

// ---------- Constants ----------

const BASE_URL = "https://atlas.microsoft.com";

export const POI_CATEGORIES: Record<POICategory, { label: string; azureCategory: string }> = {
  gas_station: { label: "Gas Station", azureCategory: "PETROL_STATION" },
  rest_area: { label: "Rest Area", azureCategory: "REST_AREA" },
  truck_stop: { label: "Truck Stop", azureCategory: "TRUCK_STOP" },
  repair_shop: { label: "Repair Shop", azureCategory: "AUTOMOBILE_REPAIR" },
  parking: { label: "Parking", azureCategory: "PARKING_GARAGE" },
  restaurant: { label: "Restaurant", azureCategory: "RESTAURANT" },
  hospital: { label: "Hospital", azureCategory: "HOSPITAL_POLYCLINIC" },
};

// ---------- Shared HTTP helpers ----------

function getKey(): string {
  return env.azureMapsKey || "";
}

async function azureMapsGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  url.searchParams.set("api-version", "1.0");
  url.searchParams.set("subscription-key", getKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Azure Maps ${path} failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function azureMapsPost(path: string, body: unknown, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  url.searchParams.set("api-version", "1.0");
  url.searchParams.set("subscription-key", getKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Azure Maps POST ${path} failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---------- Mock data (Danish geography) ----------

function mockTruckRouteComparison(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): TruckRouteComparison {
  const baseDist = Math.round(
    Math.sqrt(Math.pow((destLat - originLat) * 111, 2) + Math.pow((destLng - originLng) * 63, 2)) * 10,
  ) / 10;
  const carDuration = Math.round(baseDist * 0.75);
  const truckDuration = Math.round(baseDist * 0.95);
  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;
  const coords: [number, number][] = [
    [originLng, originLat],
    [midLng - 0.05, midLat + 0.02],
    [midLng + 0.05, midLat - 0.02],
    [destLng, destLat],
  ];
  return {
    carRoute: {
      travelMode: "car",
      durationMinutes: carDuration,
      durationInTrafficMinutes: carDuration + Math.round(carDuration * 0.15),
      distanceKm: baseDist,
      trafficDelayMinutes: Math.round(carDuration * 0.15),
      coordinates: coords,
    },
    truckRoute: {
      travelMode: "truck",
      durationMinutes: truckDuration,
      durationInTrafficMinutes: truckDuration + Math.round(truckDuration * 0.12),
      distanceKm: Math.round(baseDist * 1.08 * 10) / 10,
      trafficDelayMinutes: Math.round(truckDuration * 0.12),
      coordinates: coords.map(([lng, lat]) => [lng + 0.01, lat + 0.005] as [number, number]),
    },
    timeDifferenceMinutes: truckDuration - carDuration,
    distanceDifferenceKm: Math.round((baseDist * 1.08 - baseDist) * 10) / 10,
    restrictions: [
      "Height restriction 4.0m on Limfjordstunnelen",
      "Weight limit 44t on municipal roads",
      "No trucks > 3.5t in Copenhagen city center 07:00-09:00",
    ],
  };
}

function mockReachableRange(center: Coordinates, timeBudgetMinutes: number, travelMode: "car" | "truck"): ReachableRange {
  const radiusDeg = (timeBudgetMinutes / 60) * (travelMode === "truck" ? 0.55 : 0.7);
  const boundary: Coordinates[] = [];
  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const jitter = 0.85 + Math.random() * 0.3;
    boundary.push({
      lat: center.lat + Math.sin(rad) * radiusDeg * jitter,
      lng: center.lng + Math.cos(rad) * radiusDeg * jitter * 1.7,
    });
  }
  return { center, boundary, timeBudgetMinutes, travelMode };
}

function mockPOIs(center: Coordinates, category?: POICategory): PointOfInterest[] {
  const allPOIs: PointOfInterest[] = [
    { id: "poi-1", name: "Circle K Motorvej E45", category: "gas_station", coordinates: { lat: 55.72, lng: 12.51 }, address: "E45 Motorvej, 2600 Glostrup", phone: "+45 43 43 12 00", distanceMeters: 2400 },
    { id: "poi-2", name: "OK Benzin Køge", category: "gas_station", coordinates: { lat: 55.46, lng: 12.18 }, address: "Ringstedvej 42, 4600 Køge", distanceMeters: 12000 },
    { id: "poi-3", name: "Shell Truck Stop Kolding", category: "truck_stop", coordinates: { lat: 55.49, lng: 9.48 }, address: "Skovvangen 2, 6000 Kolding", phone: "+45 75 53 22 11", distanceMeters: 45000 },
    { id: "poi-4", name: "Rasteplads Kildebjerg Nord", category: "rest_area", coordinates: { lat: 55.58, lng: 9.72 }, address: "E45 Northbound, 7100 Vejle", distanceMeters: 32000 },
    { id: "poi-5", name: "Dækcentralen Odense", category: "repair_shop", coordinates: { lat: 55.40, lng: 10.39 }, address: "Edisonsvej 10, 5000 Odense C", phone: "+45 66 12 33 44", distanceMeters: 58000 },
    { id: "poi-6", name: "P-hus Kongens Nytorv", category: "parking", coordinates: { lat: 55.68, lng: 12.59 }, address: "Kongens Nytorv 34, 1050 København K", distanceMeters: 1200 },
    { id: "poi-7", name: "Restaurant Vejlegården", category: "restaurant", coordinates: { lat: 55.71, lng: 9.53 }, address: "Flegborg 16, 7100 Vejle", phone: "+45 75 82 03 03", distanceMeters: 37000 },
    { id: "poi-8", name: "Aarhus Universitetshospital", category: "hospital", coordinates: { lat: 56.17, lng: 10.20 }, address: "Palle Juul-Jensens Blvd 99, 8200 Aarhus N", phone: "+45 78 45 00 00", distanceMeters: 85000 },
    { id: "poi-9", name: "Q8 Aarhus Syd", category: "gas_station", coordinates: { lat: 56.13, lng: 10.17 }, address: "Skanderborgvej 150, 8260 Viby J", distanceMeters: 78000 },
    { id: "poi-10", name: "Truck Service Danmark", category: "repair_shop", coordinates: { lat: 55.86, lng: 9.84 }, address: "Industriparken 8, 7100 Vejle", phone: "+45 75 72 11 22", distanceMeters: 35000 },
  ];
  const filtered = category ? allPOIs.filter((p) => p.category === category) : allPOIs;
  return filtered.map((p) => ({
    ...p,
    distanceMeters: Math.round(
      Math.sqrt(Math.pow((p.coordinates.lat - center.lat) * 111000, 2) + Math.pow((p.coordinates.lng - center.lng) * 63000, 2)),
    ),
  }));
}

function mockWeather(locations: Coordinates[]): LocationWeather[] {
  const labels = ["Copenhagen", "Aarhus", "Odense", "Vejle", "Kolding", "Roskilde", "Aalborg", "Esbjerg"];
  return locations.map((loc, i) => {
    const current: WeatherDayForecast = {
      date: new Date().toISOString().split("T")[0],
      iconPhrase: ["Partly Sunny", "Rain", "Cloudy", "Mostly Sunny", "Windy", "Light Rain"][i % 6],
      iconCode: [3, 12, 7, 2, 32, 13][i % 6],
      temperatureMin: 4 + (i % 5),
      temperatureMax: 10 + (i % 7),
      windSpeed: 15 + (i * 3) % 20,
      windDirection: ["SW", "W", "NW", "N", "NE", "E"][i % 6],
      precipitationProbability: [20, 75, 40, 10, 30, 65][i % 6],
      precipitationType: ["Rain", "Rain", "None", "None", "Rain", "Drizzle"][i % 6],
      hasPrecipitation: [false, true, false, false, true, true][i % 6],
      cloudCover: [45, 85, 70, 30, 55, 80][i % 6],
      uvIndex: [2, 1, 1, 3, 2, 1][i % 6],
    };
    return {
      location: loc,
      locationLabel: labels[i % labels.length],
      forecasts: [current],
      current,
    };
  });
}

function mockSnappedPositions(positions: Coordinates[]): SnappedPosition[] {
  const roads = ["Roskildevej", "E45 Motorvej", "Vesterbrogade", "Amagerbrogade", "Hillerødmotorvejen", "Køge Bugt Motorvejen"];
  return positions.map((pos, i) => ({
    original: pos,
    snapped: {
      lat: pos.lat + (Math.random() - 0.5) * 0.0005,
      lng: pos.lng + (Math.random() - 0.5) * 0.0005,
    },
    roadName: roads[i % roads.length],
    speedLimitKmh: [50, 130, 50, 50, 110, 110][i % 6],
  }));
}

// ---------- Public API ----------

export interface RouteDirectionsOptions {
  origin: Coordinates;
  destination: Coordinates;
  travelMode?: "car" | "truck";
  truckWeight?: number;
  truckHeight?: number;
  truckLength?: number;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export async function getRouteDirections(options: RouteDirectionsOptions): Promise<TruckRouteComparison> {
  if (isDemoModeEnabled()) {
    return mockTruckRouteComparison(
      options.origin.lat, options.origin.lng,
      options.destination.lat, options.destination.lng,
    );
  }

  const { origin, destination, travelMode = "car" } = options;
  const avoid: string[] = [];
  if (options.avoidTolls) avoid.push("tollRoads");
  if (options.avoidHighways) avoid.push("motorways");
  const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join(",")}` : "";

  async function fetchRoute(mode: "car" | "truck"): Promise<RouteComparisonEntry> {
    let truckParams = "";
    if (mode === "truck") {
      if (options.truckWeight) truckParams += `&vehicleWeight=${options.truckWeight}`;
      if (options.truckHeight) truckParams += `&vehicleHeight=${options.truckHeight}`;
      if (options.truckLength) truckParams += `&vehicleLength=${options.truckLength}`;
    }
    const data = (await azureMapsGet(
      `/route/directions/json`,
      Object.fromEntries(new URLSearchParams(
        `query=${origin.lat},${origin.lng}:${destination.lat},${destination.lng}&travelMode=${mode}&traffic=true&routeType=fastest${avoidParam}${truckParams}`,
      )),
    )) as { routes: { summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number }; legs: { points: { latitude: number; longitude: number }[] }[] }[] };
    const route = data.routes[0];
    const coords: [number, number][] = (route.legs?.[0]?.points || []).map(
      (p: { latitude: number; longitude: number }) => [p.longitude, p.latitude] as [number, number],
    );
    return {
      travelMode: mode,
      durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
      durationInTrafficMinutes: Math.round((route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60),
      distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
      trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
      coordinates: coords,
    };
  }

  const [carRoute, truckRoute] = await Promise.all([
    fetchRoute("car"),
    fetchRoute(travelMode === "truck" ? "truck" : "car"),
  ]);

  return {
    carRoute,
    truckRoute: travelMode === "truck" ? truckRoute : carRoute,
    timeDifferenceMinutes: truckRoute.durationInTrafficMinutes - carRoute.durationInTrafficMinutes,
    distanceDifferenceKm: Math.round((truckRoute.distanceKm - carRoute.distanceKm) * 10) / 10,
    restrictions: [],
  };
}

export interface RouteRangeOptions {
  center: Coordinates;
  timeBudgetMinutes?: number;
  fuelBudgetLiters?: number;
  distanceBudgetKm?: number;
  travelMode?: "car" | "truck";
}

export async function getRouteRange(options: RouteRangeOptions): Promise<ReachableRange> {
  const { center, timeBudgetMinutes = 30, travelMode = "car" } = options;

  if (isDemoModeEnabled()) {
    return mockReachableRange(center, timeBudgetMinutes, travelMode);
  }

  const params: Record<string, string> = {
    query: `${center.lat},${center.lng}`,
    timeBudgetInSec: String(timeBudgetMinutes * 60),
    travelMode,
  };
  if (options.fuelBudgetLiters) params.fuelBudgetInLiters = String(options.fuelBudgetLiters);
  if (options.distanceBudgetKm) params.distanceBudgetInMeters = String(options.distanceBudgetKm * 1000);

  const data = (await azureMapsGet("/route/range/json", params)) as {
    reachableRange: { boundary: { latitude: number; longitude: number }[] };
  };

  return {
    center,
    boundary: data.reachableRange.boundary.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    timeBudgetMinutes,
    fuelBudgetLiters: options.fuelBudgetLiters,
    distanceBudgetKm: options.distanceBudgetKm,
    travelMode,
  };
}

export interface SearchPOIOptions {
  center: Coordinates;
  radiusMeters?: number;
  category?: POICategory;
  limit?: number;
}

export async function searchPOI(options: SearchPOIOptions): Promise<PointOfInterest[]> {
  const { center, radiusMeters = 50000, category, limit = 10 } = options;

  if (isDemoModeEnabled()) {
    return mockPOIs(center, category).slice(0, limit);
  }

  const categoryFilter = category ? POI_CATEGORIES[category].azureCategory : undefined;
  const params: Record<string, string> = {
    query: categoryFilter || "truck stop",
    lat: String(center.lat),
    lon: String(center.lng),
    radius: String(radiusMeters),
    limit: String(limit),
    language: "da-DK",
  };

  const data = (await azureMapsGet("/search/poi/json", params)) as {
    results: {
      id: string;
      poi: { name: string; categories: string[] };
      address: { freeformAddress: string };
      position: { lat: number; lon: number };
      dist: number;
      phone?: string;
    }[];
  };

  return data.results.map((r) => ({
    id: r.id,
    name: r.poi.name,
    category: category || inferCategory(r.poi.categories),
    coordinates: { lat: r.position.lat, lng: r.position.lon },
    address: r.address.freeformAddress,
    phone: r.phone,
    distanceMeters: Math.round(r.dist),
  }));
}

function inferCategory(categories: string[]): POICategory {
  const joined = categories.join(" ").toLowerCase();
  if (joined.includes("petrol") || joined.includes("gas")) return "gas_station";
  if (joined.includes("rest")) return "rest_area";
  if (joined.includes("truck")) return "truck_stop";
  if (joined.includes("repair") || joined.includes("auto")) return "repair_shop";
  if (joined.includes("parking")) return "parking";
  if (joined.includes("restaurant") || joined.includes("food")) return "restaurant";
  if (joined.includes("hospital")) return "hospital";
  return "rest_area";
}

export interface SearchPOIAlongRouteOptions {
  route: Coordinates[];
  category?: POICategory;
  maxDetourSeconds?: number;
  limit?: number;
}

export async function searchPOIAlongRoute(options: SearchPOIAlongRouteOptions): Promise<PointOfInterest[]> {
  const { route, category, limit = 10 } = options;

  if (isDemoModeEnabled()) {
    const mid = route[Math.floor(route.length / 2)] || route[0];
    return mockPOIs(mid, category).slice(0, limit);
  }

  const categoryFilter = category ? POI_CATEGORIES[category].azureCategory : "PETROL_STATION";
  const geometry = {
    type: "LineString",
    coordinates: route.map((c) => [c.lng, c.lat]),
  };

  const data = (await azureMapsPost(
    "/search/alongRoute/json",
    { route: geometry },
    {
      query: categoryFilter,
      maxDetourTime: String(options.maxDetourSeconds || 600),
      limit: String(limit),
    },
  )) as {
    results: {
      id: string;
      poi: { name: string; categories: string[] };
      address: { freeformAddress: string };
      position: { lat: number; lon: number };
      detourTime: number;
      dist: number;
      phone?: string;
    }[];
  };

  return data.results.map((r) => ({
    id: r.id,
    name: r.poi.name,
    category: category || inferCategory(r.poi.categories),
    coordinates: { lat: r.position.lat, lng: r.position.lon },
    address: r.address.freeformAddress,
    phone: r.phone,
    distanceMeters: Math.round(r.dist),
    detourTimeSeconds: r.detourTime,
  }));
}

export interface WeatherForecastOptions {
  locations: Coordinates[];
  durationDays?: number;
}

export async function getWeatherForecast(options: WeatherForecastOptions): Promise<LocationWeather[]> {
  const { locations, durationDays = 1 } = options;

  if (isDemoModeEnabled()) {
    return mockWeather(locations);
  }

  const results = await Promise.all(
    locations.map(async (loc) => {
      const data = (await azureMapsGet("/weather/forecast/daily/json", {
        query: `${loc.lat},${loc.lng}`,
        duration: String(durationDays),
      })) as {
        forecasts: {
          date: string;
          day: { iconPhrase: string; icon: number; wind: { speed: { value: number }; direction: { localizedDescription: string } }; precipitationProbability: number; precipitationType: string; hasPrecipitation: boolean; cloudCover: number };
          temperature: { minimum: { value: number }; maximum: { value: number } };
          airAndPollen?: { name: string; value: number }[];
        }[];
      };

      const forecasts: WeatherDayForecast[] = data.forecasts.map((f) => ({
        date: f.date,
        iconPhrase: f.day.iconPhrase,
        iconCode: f.day.icon,
        temperatureMin: f.temperature.minimum.value,
        temperatureMax: f.temperature.maximum.value,
        windSpeed: f.day.wind.speed.value,
        windDirection: f.day.wind.direction.localizedDescription,
        precipitationProbability: f.day.precipitationProbability,
        precipitationType: f.day.precipitationType || "None",
        hasPrecipitation: f.day.hasPrecipitation,
        cloudCover: f.day.cloudCover,
        uvIndex: f.airAndPollen?.find((a) => a.name === "UVIndex")?.value || 0,
      }));

      return {
        location: loc,
        locationLabel: `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`,
        forecasts,
        current: forecasts[0],
      };
    }),
  );

  return results;
}

export interface SnapToRoadsOptions {
  positions: Coordinates[];
  includeSpeedLimit?: boolean;
}

export async function snapToRoads(options: SnapToRoadsOptions): Promise<SnappedPosition[]> {
  const { positions } = options;

  if (isDemoModeEnabled()) {
    return mockSnappedPositions(positions);
  }

  const points = positions.map((p) => `${p.lat},${p.lng}`).join(":");
  const data = (await azureMapsGet("/route/snapToRoads", {
    query: points,
    includeSpeedLimit: String(options.includeSpeedLimit !== false),
  })) as {
    snappedPoints: {
      coordinate: { latitude: number; longitude: number };
      roadName?: string;
      speedLimit?: number;
    }[];
  };

  return data.snappedPoints.map((sp, i) => ({
    original: positions[i],
    snapped: { lat: sp.coordinate.latitude, lng: sp.coordinate.longitude },
    roadName: sp.roadName,
    speedLimitKmh: sp.speedLimit,
  }));
}
