import type { OpenAIToolDefinition } from "../../agentTools";
import { storageService } from "../../storageService";
import { env } from "../../../config/env";
import type { SavedJourney } from "../../../types/journey";
import { v4 as uuidv4 } from "uuid";
import { computeCorridorBounds, fetchCorridorIncidents, classifyStatus } from "../../../hooks/useJourneyMonitor";
import { compareRoutes } from "../../../utils/routeComparison";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback, getPlannedJourneyCallback } from "./sharedTools";
import {
  getRouteDirections,
  getRouteRange,
  searchPOIAlongRoute,
  getWeatherForecast,
  snapToRoads,
} from "../../azureMapsService";
import type { POICategory } from "../../../types/map";

// --- Event dispatching for React Query cache invalidation ---
export const JOURNEYS_CHANGED_EVENT = "agent:journeys-changed";

function notifyJourneysChanged() {
  window.dispatchEvent(new CustomEvent(JOURNEYS_CHANGED_EVENT));
}

// --- Tool Definitions ---

const trafficOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_location",
      description: "Geocode a place name or address in Denmark to geographic coordinates.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The place name or address to search for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_journey",
      description: "Plan a journey between two locations with traffic-aware timing. Use search_location first to resolve place names.",
      parameters: {
        type: "object",
        properties: {
          origin_lat: { type: "number", description: "Origin latitude" },
          origin_lng: { type: "number", description: "Origin longitude" },
          origin_label: { type: "string", description: "Origin display name" },
          destination_lat: { type: "number", description: "Destination latitude" },
          destination_lng: { type: "number", description: "Destination longitude" },
          destination_label: { type: "string", description: "Destination display name" },
          transport_mode: { type: "string", enum: ["car", "transit", "bicycle", "walk"], description: "Transport mode (default: car)" },
          departure_time: { type: "string", description: "ISO 8601 departure time (optional)" },
          avoid_tolls: { type: "boolean", description: "Avoid toll roads (default: false)" },
          avoid_highways: { type: "boolean", description: "Avoid highways (default: false)" },
        },
        required: ["origin_lat", "origin_lng", "origin_label", "destination_lat", "destination_lng", "destination_label"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_traffic_incidents",
      description: "Get current traffic incidents (accidents, roadwork, congestion) for a geographic area.",
      parameters: {
        type: "object",
        properties: {
          north: { type: "number", description: "North boundary latitude" },
          south: { type: "number", description: "South boundary latitude" },
          east: { type: "number", description: "East boundary longitude" },
          west: { type: "number", description: "West boundary longitude" },
        },
        required: ["north", "south", "east", "west"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_journey",
      description: "Save a journey to the user's saved journeys list.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Display name for the saved journey" },
          origin_label: { type: "string", description: "Origin display name" },
          origin_lat: { type: "number", description: "Origin latitude" },
          origin_lng: { type: "number", description: "Origin longitude" },
          destination_label: { type: "string", description: "Destination display name" },
          destination_lat: { type: "number", description: "Destination latitude" },
          destination_lng: { type: "number", description: "Destination longitude" },
          transport_mode: { type: "string", enum: ["car", "transit", "bicycle", "walk"], description: "Transport mode (default: car)" },
        },
        required: ["name", "origin_label", "origin_lat", "origin_lng", "destination_label", "destination_lat", "destination_lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_saved_journeys",
      description: "Get all saved journeys from the user's saved list.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_saved_journey",
      description: "Delete a saved journey by its ID.",
      parameters: {
        type: "object",
        properties: {
          journey_id: { type: "string", description: "The ID of the saved journey to delete" },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_routes",
      description: "Compare current traffic conditions on a route against historical data.",
      parameters: {
        type: "object",
        properties: {
          origin_lat: { type: "number", description: "Origin latitude" },
          origin_lng: { type: "number", description: "Origin longitude" },
          origin_label: { type: "string", description: "Origin display name" },
          destination_lat: { type: "number", description: "Destination latitude" },
          destination_lng: { type: "number", description: "Destination longitude" },
          destination_label: { type: "string", description: "Destination display name" },
        },
        required: ["origin_lat", "origin_lng", "origin_label", "destination_lat", "destination_lng", "destination_label"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_commute_history",
      description: "Get past commute history entries. Can filter by saved journey ID.",
      parameters: {
        type: "object",
        properties: {
          journey_id: { type: "string", description: "Optional saved journey ID to filter history" },
          limit: { type: "number", description: "Maximum entries to return (default: 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_commute_status",
      description: "Analyze current traffic for a saved journey and recommend whether to leave now, wait, or take an alternative.",
      parameters: {
        type: "object",
        properties: {
          journey_id: { type: "string", description: "The ID of the saved journey to check" },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "monitor_saved_journey",
      description: "Get detailed real-time monitoring for a specific saved journey.",
      parameters: {
        type: "object",
        properties: {
          journey_id: { type: "string", description: "The ID of the saved journey to monitor" },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "monitor_all_journeys",
      description: "Get a quick status overview of all saved journeys.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_reroute",
      description: "Find alternative routes for a saved journey when traffic delays are detected.",
      parameters: {
        type: "object",
        properties: {
          journey_id: { type: "string", description: "The ID of the saved journey to find alternatives for" },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_truck_route",
      description: "Compare car vs truck routing between two locations, showing time/distance differences and truck restrictions.",
      parameters: {
        type: "object",
        properties: {
          origin_lat: { type: "number", description: "Origin latitude" },
          origin_lng: { type: "number", description: "Origin longitude" },
          destination_lat: { type: "number", description: "Destination latitude" },
          destination_lng: { type: "number", description: "Destination longitude" },
          truck_weight: { type: "number", description: "Truck weight in kg (optional)" },
          truck_height: { type: "number", description: "Truck height in meters (optional)" },
          truck_length: { type: "number", description: "Truck length in meters (optional)" },
        },
        required: ["origin_lat", "origin_lng", "destination_lat", "destination_lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reachable_range",
      description: "Calculate the reachable area (isochrone) from a location within a given time or fuel budget.",
      parameters: {
        type: "object",
        properties: {
          center_lat: { type: "number", description: "Center latitude" },
          center_lng: { type: "number", description: "Center longitude" },
          time_budget_minutes: { type: "number", description: "Time budget in minutes (default: 30)" },
          travel_mode: { type: "string", enum: ["car", "truck"], description: "Travel mode (default: car)" },
        },
        required: ["center_lat", "center_lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_poi_along_route",
      description: "Search for points of interest (gas stations, rest areas, truck stops, restaurants) along a route.",
      parameters: {
        type: "object",
        properties: {
          origin_lat: { type: "number", description: "Route origin latitude" },
          origin_lng: { type: "number", description: "Route origin longitude" },
          destination_lat: { type: "number", description: "Route destination latitude" },
          destination_lng: { type: "number", description: "Route destination longitude" },
          category: { type: "string", enum: ["gas_station", "rest_area", "truck_stop", "repair_shop", "parking", "restaurant", "hospital"], description: "POI category to search for" },
          limit: { type: "number", description: "Max results (default: 10)" },
        },
        required: ["origin_lat", "origin_lng", "destination_lat", "destination_lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather_for_route",
      description: "Get weather forecasts at key waypoints along a route or at specific locations.",
      parameters: {
        type: "object",
        properties: {
          locations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
              required: ["lat", "lng"],
            },
            description: "Array of locations to get weather for",
          },
        },
        required: ["locations"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "snap_fleet_positions",
      description: "Snap GPS positions to nearest roads and get road names and speed limits.",
      parameters: {
        type: "object",
        properties: {
          positions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
              required: ["lat", "lng"],
            },
            description: "Array of GPS positions to snap to roads",
          },
        },
        required: ["positions"],
      },
    },
  },
];

export const trafficToolDefinitions: OpenAIToolDefinition[] = [
  ...trafficOnlyTools,
  ...sharedToolDefinitions,
];

// --- Tool Handlers ---

async function handleSearchLocation(args: { query: string }): Promise<unknown> {
  const key = env.azureMapsKey;
  const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${key}&query=${encodeURIComponent(args.query)}&countrySet=DK&limit=3&language=da-DK`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps search failed: ${res.statusText}`);
  const data = await res.json();
  const results = (data.results || []).map(
    (r: { position: { lat: number; lon: number }; address: { freeformAddress: string } }) => ({
      lat: r.position.lat,
      lng: r.position.lon,
      label: r.address.freeformAddress,
    })
  );
  return { results };
}

async function handlePlanJourney(args: {
  origin_lat: number; origin_lng: number; origin_label: string;
  destination_lat: number; destination_lng: number; destination_label: string;
  transport_mode?: string; departure_time?: string;
  avoid_tolls?: boolean; avoid_highways?: boolean;
}): Promise<unknown> {
  const key = env.azureMapsKey;
  const mode = args.transport_mode || "car";
  const travelMode = mode === "transit" ? "car" : mode;
  const avoid: string[] = [];
  if (args.avoid_tolls) avoid.push("tollRoads");
  if (args.avoid_highways) avoid.push("motorways");
  const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join(",")}` : "";
  const departParam = args.departure_time ? `&departAt=${args.departure_time}` : "";

  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${args.origin_lat},${args.origin_lng}:${args.destination_lat},${args.destination_lng}&travelMode=${travelMode}&traffic=true&routeType=fastest&computeBestOrder=false&instructionsType=text${avoidParam}${departParam}&maxAlternatives=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();

  const routes = (data.routes || []).map(
    (route: {
      summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number; departureTime: string; arrivalTime: string };
      legs: { points: { latitude: number; longitude: number }[]; steps: { instruction?: { text: string }; routeOffsetInMeters: number; travelTimeInSeconds: number; maneuver: string; startPoint?: { latitude: number; longitude: number } }[] }[];
    }, idx: number) => {
      const leg = route.legs?.[0];
      const coordinates: [number, number][] = (leg?.points || []).map(
        (p: { latitude: number; longitude: number }) => [p.longitude, p.latitude] as [number, number]
      );
      return {
        id: uuidv4(),
        summary: `Route ${idx + 1} via ${args.origin_label} to ${args.destination_label}`,
        durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
        durationInTrafficMinutes: Math.round((route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60),
        distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
        departureTime: route.summary.departureTime || new Date().toISOString(),
        arrivalTime: route.summary.arrivalTime || "",
        coordinates,
        trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
        incidents: [] as [],
        isRecommended: idx === 0,
        steps: (leg?.steps || []).slice(0, 20).map(
          (step: { instruction?: { text: string }; routeOffsetInMeters: number; travelTimeInSeconds: number; maneuver: string; startPoint?: { latitude: number; longitude: number } }) => ({
            instruction: step.instruction?.text || step.maneuver,
            distanceKm: Math.round((step.routeOffsetInMeters / 1000) * 10) / 10,
            durationMinutes: Math.round(step.travelTimeInSeconds / 60),
            maneuver: step.maneuver,
            coordinates: step.startPoint ? ([step.startPoint.longitude, step.startPoint.latitude] as [number, number]) : ([0, 0] as [number, number]),
          })
        ),
      };
    }
  );

  const plannedJourneyCallback = getPlannedJourneyCallback();
  if (plannedJourneyCallback) {
    const recommendations = routes.length > 1
      ? [`Route 1 is the fastest option with estimated ${routes[0].durationInTrafficMinutes} minutes in current traffic.`]
      : [];
    plannedJourneyCallback({ origin: { coordinates: { lat: args.origin_lat, lng: args.origin_lng }, label: args.origin_label }, destination: { coordinates: { lat: args.destination_lat, lng: args.destination_lng }, label: args.destination_label }, routes, recommendations });
  }
  const navigateCallback = getNavigateCallback();
  if (navigateCallback) navigateCallback("/journey");

  return { origin: args.origin_label, destination: args.destination_label, routes, routeCount: routes.length };
}

async function handleGetTrafficIncidents(args: { north: number; south: number; east: number; west: number }): Promise<unknown> {
  const key = env.azureMapsKey;
  const url = `https://atlas.microsoft.com/traffic/incident/detail/json?api-version=1.0&subscription-key=${key}&style=s3&boundingbox=${args.south},${args.west},${args.north},${args.east}&boundingZoom=12&trafficmodelid=-1&projection=EPSG4326&language=da-DK`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps traffic failed: ${res.statusText}`);
  const data = await res.json();

  const pois: Array<{ id: string; p: { x: number; y: number }; ic: number; ty: number; d?: string; c?: string; f?: string; t?: string; dl?: number; r?: string; cs?: number }> = data.tm?.poi || [];
  const incidents = pois.filter(poi => !poi.cs || poi.cs === 0).slice(0, 20).map(poi => ({
    id: poi.id || uuidv4(),
    title: poi.d || poi.c || "Traffic incident",
    description: [poi.d, poi.c, poi.f ? `From: ${poi.f}` : "", poi.t ? `To: ${poi.t}` : ""].filter(Boolean).join(" - "),
    location: { lat: poi.p.y, lng: poi.p.x },
    severity: poi.ty >= 4 ? "critical" : poi.ty >= 3 ? "high" : poi.ty >= 2 ? "medium" : "low",
    type: poi.ic <= 1 ? "accident" : poi.ic <= 6 ? "other" : poi.ic <= 8 ? "closure" : poi.ic === 9 ? "roadwork" : "other",
    roadName: poi.r || "",
    delayMinutes: poi.dl ? Math.round(poi.dl / 60) : 0,
  }));
  return { incidents, totalCount: incidents.length, area: `${args.south.toFixed(2)},${args.west.toFixed(2)} to ${args.north.toFixed(2)},${args.east.toFixed(2)}` };
}

function handleSaveJourney(args: { name: string; origin_label: string; origin_lat: number; origin_lng: number; destination_label: string; destination_lat: number; destination_lng: number; transport_mode?: string }): unknown {
  const journey: SavedJourney = {
    id: uuidv4(), name: args.name,
    origin: { coordinates: { lat: args.origin_lat, lng: args.origin_lng }, label: args.origin_label },
    destination: { coordinates: { lat: args.destination_lat, lng: args.destination_lng }, label: args.destination_label },
    preferences: { transportMode: (args.transport_mode as "car" | "transit" | "bicycle" | "walk") || "car", avoidTolls: false, avoidHighways: false },
    morningAlert: null, createdAt: new Date().toISOString(),
  };
  storageService.saveJourney(journey);
  notifyJourneysChanged();
  return { success: true, journeyId: journey.id, name: journey.name };
}

function handleGetSavedJourneys(): unknown {
  const journeys = storageService.getSavedJourneys();
  return {
    journeys: journeys.map(j => ({ id: j.id, name: j.name, origin: j.origin.label, destination: j.destination.label, transportMode: j.preferences.transportMode, morningAlertEnabled: j.morningAlert?.enabled || false, createdAt: j.createdAt })),
    totalCount: journeys.length,
  };
}

function handleDeleteSavedJourney(args: { journey_id: string }): unknown {
  storageService.deleteJourney(args.journey_id);
  notifyJourneysChanged();
  return { success: true, deletedId: args.journey_id };
}

async function handleCompareRoutes(args: { origin_lat: number; origin_lng: number; origin_label: string; destination_lat: number; destination_lng: number; destination_label: string }): Promise<unknown> {
  const key = env.azureMapsKey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${args.origin_lat},${args.origin_lng}:${args.destination_lat},${args.destination_lng}&travelMode=car&traffic=true&routeType=fastest&instructionsType=text`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return { error: "No route found" };
  const currentDuration = Math.round(route.summary.travelTimeInSeconds / 60);
  const currentDelay = Math.round(route.summary.trafficDelayInSeconds / 60);
  const currentDistance = Math.round((route.summary.lengthInMeters / 1000) * 10) / 10;
  const history = storageService.getRouteHistory();
  const matching = history.filter(h => Math.abs(h.originLat - args.origin_lat) < 0.01 && Math.abs(h.originLng - args.origin_lng) < 0.01 && Math.abs(h.destinationLat - args.destination_lat) < 0.01 && Math.abs(h.destinationLng - args.destination_lng) < 0.01);
  if (matching.length === 0) return { current: { durationMinutes: currentDuration, durationInTrafficMinutes: currentDuration + currentDelay, trafficDelayMinutes: currentDelay, distanceKm: currentDistance }, history: null, message: "No historical data available for this route yet." };
  const avgDuration = Math.round(matching.reduce((s, h) => s + h.durationInTrafficMinutes, 0) / matching.length);
  const minDuration = Math.min(...matching.map(h => h.durationInTrafficMinutes));
  const maxDuration = Math.max(...matching.map(h => h.durationInTrafficMinutes));
  const avgDelay = Math.round(matching.reduce((s, h) => s + h.trafficDelayMinutes, 0) / matching.length);
  return { current: { durationMinutes: currentDuration, durationInTrafficMinutes: currentDuration + currentDelay, trafficDelayMinutes: currentDelay, distanceKm: currentDistance }, history: { totalTrips: matching.length, avgDurationMinutes: avgDuration, minDurationMinutes: minDuration, maxDurationMinutes: maxDuration, avgDelayMinutes: avgDelay }, comparison: { vsAverage: (currentDuration + currentDelay) - avgDuration, vsBest: (currentDuration + currentDelay) - minDuration, status: (currentDuration + currentDelay) <= avgDuration ? "better_than_average" : "worse_than_average" } };
}

function handleGetCommuteHistory(args: { journey_id?: string; limit?: number }): unknown {
  const limit = args.limit || 10;
  const history = storageService.getRouteHistory(args.journey_id);
  const entries = history.slice(0, limit);
  return { entries: entries.map(e => ({ id: e.id, journeyId: e.journeyId, origin: e.originLabel, destination: e.destinationLabel, durationMinutes: e.durationMinutes, durationInTrafficMinutes: e.durationInTrafficMinutes, trafficDelayMinutes: e.trafficDelayMinutes, distanceKm: e.distanceKm, incidentCount: e.incidentCount, summary: e.summary, timestamp: e.timestamp })), totalCount: history.length, returnedCount: entries.length };
}

async function handleCheckCommuteStatus(args: { journey_id: string }): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find(j => j.id === args.journey_id);
  if (!journey) return { error: `Journey not found: ${args.journey_id}` };
  const key = env.azureMapsKey;
  const { origin, destination } = journey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest&instructionsType=text`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return { error: "No route found" };
  const baseDuration = Math.round(route.summary.travelTimeInSeconds / 60);
  const trafficDelay = Math.round(route.summary.trafficDelayInSeconds / 60);
  const totalDuration = baseDuration + trafficDelay;
  const delayRatio = baseDuration > 0 ? trafficDelay / baseDuration : 0;
  const history = storageService.getRouteHistory(args.journey_id);
  const historicalAvg = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.durationInTrafficMinutes, 0) / history.length) : null;
  let recommendation: string;
  let action: string;
  if (delayRatio < 0.1) { recommendation = "Traffic is clear. Great time to leave!"; action = "leave_now"; }
  else if (delayRatio < 0.3) { recommendation = `Moderate delays (+${trafficDelay} min). Within normal range — fine to leave now.`; action = "leave_now"; }
  else if (delayRatio < 0.6) { recommendation = `Significant delays (+${trafficDelay} min). Consider waiting 15-30 minutes.`; action = "wait"; }
  else { recommendation = `Heavy delays (+${trafficDelay} min). Consider an alternative route or waiting.`; action = "consider_alternative"; }
  return { journey: { id: journey.id, name: journey.name }, current: { baseDurationMinutes: baseDuration, trafficDelayMinutes: trafficDelay, totalDurationMinutes: totalDuration, delayPercentage: Math.round(delayRatio * 100) }, historicalAvgMinutes: historicalAvg, recommendation, action };
}

async function handleMonitorSavedJourney(args: { journey_id: string }): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find(j => j.id === args.journey_id);
  if (!journey) return { error: `Journey not found: ${args.journey_id}` };
  const bounds = computeCorridorBounds(journey.origin.coordinates.lat, journey.origin.coordinates.lng, journey.destination.coordinates.lat, journey.destination.coordinates.lng);
  const incidents = await fetchCorridorIncidents(bounds);
  const status = classifyStatus(incidents);
  const key = env.azureMapsKey;
  const { origin, destination } = journey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest`;
  let currentDuration = 0; let trafficDelay = 0;
  try { const res = await fetch(url); if (res.ok) { const data = await res.json(); const route = data.routes?.[0]; if (route) { currentDuration = Math.round(route.summary.travelTimeInSeconds / 60); trafficDelay = Math.round(route.summary.trafficDelayInSeconds / 60); } } } catch { /* Continue with incidents only */ }
  return { journey: { id: journey.id, name: journey.name }, status, incidents: incidents.map(i => ({ title: i.title, severity: i.severity, type: i.type, roadName: i.roadName, delayMinutes: i.delayMinutes })), incidentCount: incidents.length, currentDurationMinutes: currentDuration, trafficDelayMinutes: trafficDelay, lastChecked: new Date().toISOString() };
}

async function handleMonitorAllJourneys(): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  if (journeys.length === 0) return { journeys: [], message: "No saved journeys found." };
  const results = await Promise.all(journeys.map(async journey => {
    const bounds = computeCorridorBounds(journey.origin.coordinates.lat, journey.origin.coordinates.lng, journey.destination.coordinates.lat, journey.destination.coordinates.lng);
    const incidents = await fetchCorridorIncidents(bounds);
    const status = classifyStatus(incidents);
    return { id: journey.id, name: journey.name, origin: journey.origin.label, destination: journey.destination.label, status, incidentCount: incidents.length, criticalCount: incidents.filter(i => i.severity === "critical").length, highCount: incidents.filter(i => i.severity === "high").length };
  }));
  return { journeys: results, totalJourneys: results.length, lastChecked: new Date().toISOString() };
}

async function handleSuggestReroute(args: { journey_id: string }): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find(j => j.id === args.journey_id);
  if (!journey) return { error: `Journey not found: ${args.journey_id}` };
  const key = env.azureMapsKey;
  const { origin, destination } = journey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest&instructionsType=text&maxAlternatives=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();
  const routes = (data.routes || []).map((route: { summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number; departureTime: string; arrivalTime: string }; legs: { points: { latitude: number; longitude: number }[]; steps: { instruction?: { text: string }; routeOffsetInMeters: number; travelTimeInSeconds: number; maneuver: string; startPoint?: { latitude: number; longitude: number } }[] }[] }, idx: number) => ({
    index: idx + 1,
    durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
    durationInTrafficMinutes: Math.round((route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60),
    distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
    trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
    isOriginal: idx === 0,
  }));
  if (routes.length <= 1) return { journey: { id: journey.id, name: journey.name }, originalRoute: routes[0] || null, alternatives: [], message: "No alternative routes available." };
  const original = routes[0];
  const alternatives = routes.slice(1).map((alt: { index: number; durationMinutes: number; durationInTrafficMinutes: number; distanceKm: number; trafficDelayMinutes: number }) => {
    const comparison = compareRoutes({ durationMinutes: original.durationMinutes, durationInTrafficMinutes: original.durationInTrafficMinutes, distanceKm: original.distanceKm, trafficDelayMinutes: original.trafficDelayMinutes }, { durationMinutes: alt.durationMinutes, durationInTrafficMinutes: alt.durationInTrafficMinutes, distanceKm: alt.distanceKm, trafficDelayMinutes: alt.trafficDelayMinutes });
    return { ...alt, comparison };
  });
  const bestAlt = alternatives.reduce((best: typeof alternatives[0] | null, alt: typeof alternatives[0]) => !best || alt.durationInTrafficMinutes < best.durationInTrafficMinutes ? alt : best, null);

  if (bestAlt && bestAlt.comparison.recommendation === "take_alternative") {
    const plannedJourneyCallback = getPlannedJourneyCallback();
    const navigateCallback = getNavigateCallback();
    if (plannedJourneyCallback) {
      const fullRes = await fetch(url);
      if (fullRes.ok) {
        const fullData = await fullRes.json();
        const fullRoutes = (fullData.routes || []).map((route: { summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number; departureTime: string; arrivalTime: string }; legs: { points: { latitude: number; longitude: number }[]; steps: { instruction?: { text: string }; routeOffsetInMeters: number; travelTimeInSeconds: number; maneuver: string; startPoint?: { latitude: number; longitude: number } }[] }[] }, idx: number) => {
          const leg = route.legs?.[0];
          const coordinates: [number, number][] = (leg?.points || []).map((p: { latitude: number; longitude: number }) => [p.longitude, p.latitude] as [number, number]);
          return { id: uuidv4(), summary: `Route ${idx + 1}`, durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60), durationInTrafficMinutes: Math.round((route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60), distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10, departureTime: route.summary.departureTime || new Date().toISOString(), arrivalTime: route.summary.arrivalTime || "", coordinates, steps: (leg?.steps || []).slice(0, 20).map((step: { instruction?: { text: string }; routeOffsetInMeters: number; travelTimeInSeconds: number; maneuver: string; startPoint?: { latitude: number; longitude: number } }) => ({ instruction: step.instruction?.text || step.maneuver, distanceKm: Math.round((step.routeOffsetInMeters / 1000) * 10) / 10, durationMinutes: Math.round(step.travelTimeInSeconds / 60), maneuver: step.maneuver, coordinates: step.startPoint ? ([step.startPoint.longitude, step.startPoint.latitude] as [number, number]) : ([0, 0] as [number, number]) })), trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60), incidents: [] as [], isRecommended: idx === 0 };
        });
        plannedJourneyCallback({ origin: { coordinates: origin.coordinates, label: origin.label }, destination: { coordinates: destination.coordinates, label: destination.label }, routes: fullRoutes, recommendations: [`Alternative route saves ${bestAlt.comparison.timeSavedMinutes} minutes.`] });
        if (navigateCallback) navigateCallback("/journey");
      }
    }
  }

  return { journey: { id: journey.id, name: journey.name }, originalRoute: original, alternatives, bestAlternative: bestAlt, recommendation: bestAlt?.comparison.recommendation || "keep_original" };
}

// --- New Azure Maps tool handlers ---

async function handleCalculateTruckRoute(args: {
  origin_lat: number; origin_lng: number;
  destination_lat: number; destination_lng: number;
  truck_weight?: number; truck_height?: number; truck_length?: number;
}): Promise<unknown> {
  const comparison = await getRouteDirections({
    origin: { lat: args.origin_lat, lng: args.origin_lng },
    destination: { lat: args.destination_lat, lng: args.destination_lng },
    travelMode: "truck",
    truckWeight: args.truck_weight,
    truckHeight: args.truck_height,
    truckLength: args.truck_length,
  });
  return {
    carRoute: {
      durationMinutes: comparison.carRoute.durationMinutes,
      durationInTrafficMinutes: comparison.carRoute.durationInTrafficMinutes,
      distanceKm: comparison.carRoute.distanceKm,
      trafficDelayMinutes: comparison.carRoute.trafficDelayMinutes,
    },
    truckRoute: {
      durationMinutes: comparison.truckRoute.durationMinutes,
      durationInTrafficMinutes: comparison.truckRoute.durationInTrafficMinutes,
      distanceKm: comparison.truckRoute.distanceKm,
      trafficDelayMinutes: comparison.truckRoute.trafficDelayMinutes,
    },
    timeDifferenceMinutes: comparison.timeDifferenceMinutes,
    distanceDifferenceKm: comparison.distanceDifferenceKm,
    restrictions: comparison.restrictions,
  };
}

async function handleGetReachableRange(args: {
  center_lat: number; center_lng: number;
  time_budget_minutes?: number; travel_mode?: "car" | "truck";
}): Promise<unknown> {
  const range = await getRouteRange({
    center: { lat: args.center_lat, lng: args.center_lng },
    timeBudgetMinutes: args.time_budget_minutes || 30,
    travelMode: args.travel_mode || "car",
  });
  return {
    center: range.center,
    boundaryPointCount: range.boundary.length,
    timeBudgetMinutes: range.timeBudgetMinutes,
    travelMode: range.travelMode,
    approximateRadiusKm: Math.round(
      Math.max(...range.boundary.map(b =>
        Math.sqrt(Math.pow((b.lat - range.center.lat) * 111, 2) + Math.pow((b.lng - range.center.lng) * 63, 2))
      )) * 10
    ) / 10,
  };
}

async function handleSearchPOIAlongRoute(args: {
  origin_lat: number; origin_lng: number;
  destination_lat: number; destination_lng: number;
  category?: POICategory; limit?: number;
}): Promise<unknown> {
  const route = [
    { lat: args.origin_lat, lng: args.origin_lng },
    { lat: (args.origin_lat + args.destination_lat) / 2, lng: (args.origin_lng + args.destination_lng) / 2 },
    { lat: args.destination_lat, lng: args.destination_lng },
  ];
  const pois = await searchPOIAlongRoute({
    route,
    category: args.category,
    limit: args.limit || 10,
  });
  return {
    pois: pois.map(p => ({
      name: p.name,
      category: p.category,
      address: p.address,
      phone: p.phone || "N/A",
      distanceMeters: p.distanceMeters,
      detourTimeSeconds: p.detourTimeSeconds,
    })),
    totalFound: pois.length,
    searchCategory: args.category || "all",
  };
}

async function handleGetWeatherForRoute(args: {
  locations: { lat: number; lng: number }[];
}): Promise<unknown> {
  const weather = await getWeatherForecast({ locations: args.locations });
  return {
    locations: weather.map(w => ({
      label: w.locationLabel,
      coordinates: w.location,
      current: w.current ? {
        temperature: `${w.current.temperatureMin}-${w.current.temperatureMax}°C`,
        conditions: w.current.iconPhrase,
        wind: `${w.current.windSpeed} km/h ${w.current.windDirection}`,
        precipitationProbability: `${w.current.precipitationProbability}%`,
        hasPrecipitation: w.current.hasPrecipitation,
      } : null,
    })),
    totalLocations: weather.length,
  };
}

async function handleSnapFleetPositions(args: {
  positions: { lat: number; lng: number }[];
}): Promise<unknown> {
  const snapped = await snapToRoads({ positions: args.positions });
  return {
    positions: snapped.map(s => ({
      original: s.original,
      snapped: s.snapped,
      roadName: s.roadName || "Unknown",
      speedLimitKmh: s.speedLimitKmh || "N/A",
      offsetMeters: Math.round(
        Math.sqrt(
          Math.pow((s.snapped.lat - s.original.lat) * 111000, 2) +
          Math.pow((s.snapped.lng - s.original.lng) * 63000, 2)
        )
      ),
    })),
    totalPositions: snapped.length,
  };
}

// --- Unified tool executor ---

export async function executeTrafficTool(name: string, argsJson: string): Promise<string> {
  // Try shared tools first
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;
  switch (name) {
    case "search_location": result = await handleSearchLocation(args); break;
    case "plan_journey": result = await handlePlanJourney(args); break;
    case "get_traffic_incidents": result = await handleGetTrafficIncidents(args); break;
    case "save_journey": {
      result = handleSaveJourney(args);
      const nav = getNavigateCallback();
      if (nav) nav("/saved");
      break;
    }
    case "get_saved_journeys": {
      result = handleGetSavedJourneys();
      const nav = getNavigateCallback();
      if (nav) nav("/saved");
      break;
    }
    case "delete_saved_journey": {
      result = handleDeleteSavedJourney(args);
      const nav = getNavigateCallback();
      if (nav) nav("/saved");
      break;
    }
    case "compare_routes": result = await handleCompareRoutes(args); break;
    case "get_commute_history": result = handleGetCommuteHistory(args); break;
    case "check_commute_status": result = await handleCheckCommuteStatus(args); break;
    case "monitor_saved_journey": result = await handleMonitorSavedJourney(args); break;
    case "monitor_all_journeys": result = await handleMonitorAllJourneys(); break;
    case "suggest_reroute": result = await handleSuggestReroute(args); break;
    case "calculate_truck_route": result = await handleCalculateTruckRoute(args); break;
    case "get_reachable_range": result = await handleGetReachableRange(args); break;
    case "search_poi_along_route": result = await handleSearchPOIAlongRoute(args); break;
    case "get_weather_for_route": result = await handleGetWeatherForRoute(args); break;
    case "snap_fleet_positions": result = await handleSnapFleetPositions(args); break;
    default: result = { error: `Unknown traffic tool: ${name}` };
  }
  return JSON.stringify(result);
}
