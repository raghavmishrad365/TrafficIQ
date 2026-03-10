import { storageService } from "./storageService";
import { d365McpClient } from "./d365McpClient";
import { env } from "../config/env";
import type { SavedJourney } from "../types/journey";
import { v4 as uuidv4 } from "uuid";
import { computeCorridorBounds, fetchCorridorIncidents, classifyStatus } from "../hooks/useJourneyMonitor";
import { compareRoutes } from "../utils/routeComparison";

// --- OpenAI Tool Definition Type ---

export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// --- Tool Definitions (OpenAI function calling format) ---

const toolDefs: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_location",
      description:
        "Geocode a place name or address in Denmark to geographic coordinates. Use this to resolve user-provided location names into lat/lng values.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The place name or address to search for, e.g. 'Copenhagen Central Station' or 'Odense'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_journey",
      description:
        "Plan a journey between two locations in Denmark. Returns route options with duration, distance, traffic delays, and step-by-step directions. Use search_location first to resolve place names to coordinates.",
      parameters: {
        type: "object",
        properties: {
          origin_lat: { type: "number", description: "Origin latitude" },
          origin_lng: { type: "number", description: "Origin longitude" },
          origin_label: { type: "string", description: "Origin display name" },
          destination_lat: { type: "number", description: "Destination latitude" },
          destination_lng: { type: "number", description: "Destination longitude" },
          destination_label: { type: "string", description: "Destination display name" },
          transport_mode: {
            type: "string",
            enum: ["car", "transit", "bicycle", "walk"],
            description: "Transport mode (default: car)",
          },
          departure_time: {
            type: "string",
            description: "ISO 8601 departure time (optional, defaults to now)",
          },
          avoid_tolls: { type: "boolean", description: "Avoid toll roads (default: false)" },
          avoid_highways: { type: "boolean", description: "Avoid highways (default: false)" },
        },
        required: [
          "origin_lat",
          "origin_lng",
          "origin_label",
          "destination_lat",
          "destination_lng",
          "destination_label",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_traffic_incidents",
      description:
        "Get current traffic incidents (accidents, roadwork, congestion, closures) for a geographic area in Denmark. Provide bounding box coordinates.",
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
      description:
        "Save a journey to the user's saved journeys list for quick access later. Provide the journey details.",
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
          transport_mode: {
            type: "string",
            enum: ["car", "transit", "bicycle", "walk"],
            description: "Transport mode (default: car)",
          },
        },
        required: [
          "name",
          "origin_label",
          "origin_lat",
          "origin_lng",
          "destination_label",
          "destination_lat",
          "destination_lng",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_saved_journeys",
      description:
        "Get all saved journeys from the user's saved list. Returns the list of journeys with their names, origins, destinations, and settings.",
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
      name: "navigate_to_page",
      description:
        "Navigate the user to a specific page in the app. Available pages: dashboard, shipments, delivery-planner, journey-planner, saved-journeys, notifications, settings.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["dashboard", "shipments", "delivery-planner", "fleet", "work-orders", "inventory", "analytics", "scheduling", "tracking", "maintenance", "returns", "journey-planner", "saved-journeys", "notifications", "settings"],
            description: "The page to navigate to",
          },
        },
        required: ["page"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_routes",
      description:
        "Compare current traffic conditions on a route against historical data. Provide origin and destination coordinates to fetch the current route and compare with past trips.",
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
      description:
        "Get past commute history entries. Can filter by a specific saved journey ID. Returns recent route planning results with duration, delay, and traffic data.",
      parameters: {
        type: "object",
        properties: {
          journey_id: {
            type: "string",
            description: "Optional saved journey ID to filter history. If omitted, returns all recent history.",
          },
          limit: {
            type: "number",
            description: "Maximum number of entries to return (default: 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_commute_status",
      description:
        "Analyze current traffic conditions for a saved journey and recommend whether to leave now, wait, or take an alternative. Provide the saved journey ID.",
      parameters: {
        type: "object",
        properties: {
          journey_id: {
            type: "string",
            description: "The ID of the saved journey to check",
          },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "monitor_saved_journey",
      description:
        "Get detailed real-time monitoring for a specific saved journey. Returns current incidents, delays, and route status.",
      parameters: {
        type: "object",
        properties: {
          journey_id: {
            type: "string",
            description: "The ID of the saved journey to monitor",
          },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "monitor_all_journeys",
      description:
        "Get a quick status overview of all saved journeys. Returns a summary of incidents and delay level for each journey (clear, minor delays, major delays, blocked).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_reroute",
      description:
        "Find alternative routes for a saved journey when traffic delays are detected. Compares the original route against alternatives and recommends the best option.",
      parameters: {
        type: "object",
        properties: {
          journey_id: {
            type: "string",
            description: "The ID of the saved journey to find alternatives for",
          },
        },
        required: ["journey_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_input_form",
      description:
        "Display an interactive Adaptive Card form in the chat to collect user input. Use this whenever you need to gather multiple pieces of information from the user (e.g., journey creation details, preferences, confirmations). The form will be rendered as an interactive card with inputs and buttons that the user can fill in and submit. You MUST call this tool instead of asking questions in plain text when collecting multiple fields.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title displayed at the top of the form card",
          },
          card: {
            type: "object",
            description:
              'An Adaptive Card payload object. Must have "type": "AdaptiveCard", "version": "1.5", a "body" array with input elements (Input.Text, Input.ChoiceSet, TextBlock, FactSet), and an "actions" array with at least one Action.Submit containing a "data" object with an "action" key.',
            properties: {
              type: { type: "string", description: "Must be \"AdaptiveCard\"" },
              version: { type: "string", description: "Must be \"1.5\"" },
              body: {
                type: "array",
                description: "Array of card elements (TextBlock, Input.Text, Input.ChoiceSet, FactSet, etc.)",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
              actions: {
                type: "array",
                description: "Array of actions (Action.Submit, Action.OpenUrl)",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
            required: ["type", "version", "body", "actions"],
          },
        },
        required: ["title", "card"],
      },
    },
  },
  // --- Supply Chain / Logistics Tools ---
  {
    type: "function",
    function: {
      name: "get_warehouse_shipments",
      description:
        "Get shipments from D365 Warehouse Management. Returns pending, active, and in-transit shipments with traffic status. Can filter by warehouse ID and shipment status.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: {
            type: "string",
            description: "Warehouse ID to filter by (e.g. 'DK01'). If omitted, returns all shipments.",
          },
          status: {
            type: "string",
            enum: ["pending", "picked", "packed", "in_transit", "delivered", "delayed", "cancelled"],
            description: "Filter by shipment status",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_delivery_schedule",
      description:
        "Get scheduled deliveries for a date range from D365. Returns shipments with their delivery windows and current traffic conditions.",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "Start date in YYYY-MM-DD format",
          },
          end_date: {
            type: "string",
            description: "End date in YYYY-MM-DD format",
          },
          warehouse_id: {
            type: "string",
            description: "Optional warehouse ID to filter by",
          },
        },
        required: ["start_date", "end_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_delivery_route",
      description:
        "Plan an optimized multi-stop delivery route for multiple shipments. Uses Azure Maps to find the best order of stops considering traffic conditions, distances, and time windows.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: {
            type: "string",
            description: "Origin warehouse ID (starting point for the delivery route)",
          },
          shipment_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of shipment IDs to include in the delivery route",
          },
        },
        required: ["warehouse_id", "shipment_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_shipment_status",
      description:
        "Check the real-time status of a specific shipment including current traffic conditions on the delivery route, ETA, and any incidents affecting delivery.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: {
            type: "string",
            description: "The shipment ID to check (e.g. 'SH-2026-001')",
          },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_shipment_eta",
      description:
        "Update the estimated time of arrival (ETA) for a shipment in D365 based on current traffic conditions.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: {
            type: "string",
            description: "The shipment ID to update",
          },
          new_eta: {
            type: "string",
            description: "New ETA in ISO 8601 format",
          },
        },
        required: ["shipment_id", "new_eta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_warehouse_inventory",
      description:
        "Check inventory levels at a specific D365 warehouse. Returns item quantities, reserved amounts, and available stock.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: {
            type: "string",
            description: "The warehouse ID to check inventory for (e.g. 'DK01')",
          },
        },
        required: ["warehouse_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_alerts",
      description:
        "Get items that are below their reorder point across all warehouses. Returns inventory items needing restocking.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fleet_status",
      description:
        "Get real-time fleet status showing all vehicles with their current location, driver, load, speed, and operational status (in_transit, idle, maintenance, returning).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_driver_performance",
      description:
        "Get driver performance metrics including hours on duty, distance covered today, and current assignment status.",
      parameters: {
        type: "object",
        properties: {
          driver_id: {
            type: "string",
            description: "Optional driver ID to filter. If omitted, returns all drivers.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_work_orders",
      description:
        "Get work orders from Field Service. Can filter by status (unscheduled, scheduled, in_progress, completed, cancelled).",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["unscheduled", "scheduled", "in_progress", "completed", "cancelled"],
            description: "Filter by work order status",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_technician_availability",
      description:
        "Get available field service technicians with their skills, current location, and today's work order count.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_work_order",
      description:
        "Assign a work order to a technician. Validates skill requirements before assignment.",
      parameters: {
        type: "object",
        properties: {
          work_order_id: {
            type: "string",
            description: "The work order ID to assign (e.g. 'WO-2026-003')",
          },
          technician_id: {
            type: "string",
            description: "The technician ID to assign the work order to (e.g. 'TECH-03')",
          },
        },
        required: ["work_order_id", "technician_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_supply_chain_kpis",
      description:
        "Get aggregated supply chain KPIs including on-time delivery rate, SLA compliance, fleet utilization, warehouse utilization, and cost metrics.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exception_alerts",
      description:
        "Get active exception alerts across the supply chain including delays, stock alerts, SLA breaches, maintenance issues, and weather advisories.",
      parameters: { type: "object", properties: {} },
    },
  },
  // --- Phase 3: Scheduling, Tracking, Maintenance, Returns ---
  {
    type: "function",
    function: {
      name: "get_schedule_board",
      description:
        "Get today's resource scheduling board showing technician assignments, time slots, and unscheduled work orders. Used for dispatch planning.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_schedule",
      description:
        "Suggest optimal work order assignment based on technician skills, location proximity, and availability. Provide a work order ID to get the best technician match.",
      parameters: {
        type: "object",
        properties: {
          work_order_id: {
            type: "string",
            description: "The work order ID to find the best technician for",
          },
        },
        required: ["work_order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "track_shipment",
      description:
        "Get full shipment tracking detail including timeline of events (Order Placed, Picked, Packed, In Transit, Delivered), current location, and estimated delivery.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: {
            type: "string",
            description: "The shipment ID to track (e.g. 'SH-2026-001')",
          },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_proof_of_delivery",
      description:
        "Get proof of delivery status for a completed shipment including signature confirmation, photo evidence, and delivery timestamp.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: {
            type: "string",
            description: "The shipment ID to check proof of delivery for",
          },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vehicle_health",
      description:
        "Get fleet vehicle health scores and predicted maintenance needs. Returns health score (0-100), mileage, engine hours, and AI-predicted maintenance alerts for each vehicle.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_alerts",
      description:
        "Get critical and upcoming maintenance alerts across the fleet. Sorted by severity. Includes predicted failure dates, confidence percentages, and estimated repair costs.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_history",
      description:
        "Get past maintenance and service records. Can filter by vehicle ID. Returns service type, date, cost, technician, and notes.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: {
            type: "string",
            description: "Optional vehicle ID to filter history (e.g. 'TRK-101'). If omitted, returns all records.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_returns",
      description:
        "Get return orders for reverse logistics. Can filter by status (requested, approved, pickup_scheduled, in_transit, received, processed, rejected).",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["requested", "approved", "pickup_scheduled", "in_transit", "received", "processed", "rejected"],
            description: "Filter by return status",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "approve_return",
      description:
        "Approve a return request and schedule pickup. Changes the return status to approved.",
      parameters: {
        type: "object",
        properties: {
          return_id: {
            type: "string",
            description: "The return ID to approve (e.g. 'RET-2026-002')",
          },
        },
        required: ["return_id"],
      },
    },
  },
];

// --- Event dispatching for React Query cache invalidation ---
// When agent tools modify data (save/delete journeys), we dispatch a custom
// event so React hooks can invalidate their query caches.
export const JOURNEYS_CHANGED_EVENT = "agent:journeys-changed";

function notifyJourneysChanged() {
  window.dispatchEvent(new CustomEvent(JOURNEYS_CHANGED_EVENT));
}

/** All tool definitions for OpenAI function calling */
export const agentToolDefinitions: OpenAIToolDefinition[] = toolDefs;

// --- Tool Handlers ---

type NavigateCallback = (path: string) => void;
type PlannedJourneyCallback = (planned: {
  origin: { coordinates: { lat: number; lng: number }; label: string };
  destination: { coordinates: { lat: number; lng: number }; label: string };
  routes: Array<{
    id: string;
    summary: string;
    durationMinutes: number;
    durationInTrafficMinutes: number;
    distanceKm: number;
    departureTime: string;
    arrivalTime: string;
    coordinates: [number, number][];
    steps: Array<{
      instruction: string;
      distanceKm: number;
      durationMinutes: number;
      maneuver: string;
      coordinates: [number, number];
    }>;
    trafficDelayMinutes: number;
    incidents: [];
    isRecommended: boolean;
  }>;
  recommendations: string[];
}) => void;

let navigateCallback: NavigateCallback | null = null;
let plannedJourneyCallback: PlannedJourneyCallback | null = null;

export function setNavigateCallback(cb: NavigateCallback) {
  navigateCallback = cb;
}

export function setPlannedJourneyCallback(cb: PlannedJourneyCallback) {
  plannedJourneyCallback = cb;
}

async function handleSearchLocation(args: {
  query: string;
}): Promise<unknown> {
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
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  destination_lat: number;
  destination_lng: number;
  destination_label: string;
  transport_mode?: string;
  departure_time?: string;
  avoid_tolls?: boolean;
  avoid_highways?: boolean;
}): Promise<unknown> {
  const key = env.azureMapsKey;
  const mode = args.transport_mode || "car";
  const travelMode = mode === "transit" ? "car" : mode;
  const avoid: string[] = [];
  if (args.avoid_tolls) avoid.push("tollRoads");
  if (args.avoid_highways) avoid.push("motorways");
  const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join(",")}` : "";
  const departParam = args.departure_time
    ? `&departAt=${args.departure_time}`
    : "";

  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${args.origin_lat},${args.origin_lng}:${args.destination_lat},${args.destination_lng}&travelMode=${travelMode}&traffic=true&routeType=fastest&computeBestOrder=false&instructionsType=text${avoidParam}${departParam}&maxAlternatives=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();

  const routes = (data.routes || []).map(
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
            roadNumbers?: string[];
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
        id: uuidv4(),
        summary: `Route ${idx + 1} via ${args.origin_label} to ${args.destination_label}`,
        durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
        durationInTrafficMinutes: Math.round(
          (route.summary.travelTimeInSeconds +
            route.summary.trafficDelayInSeconds) /
            60
        ),
        distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
        departureTime:
          route.summary.departureTime || new Date().toISOString(),
        arrivalTime: route.summary.arrivalTime || "",
        coordinates,
        trafficDelayMinutes: Math.round(
          route.summary.trafficDelayInSeconds / 60
        ),
        incidents: [] as [],
        isRecommended: idx === 0,
        steps: (leg?.steps || []).slice(0, 20).map(
          (step: {
            instruction?: { text: string };
            routeOffsetInMeters: number;
            travelTimeInSeconds: number;
            maneuver: string;
            startPoint?: { latitude: number; longitude: number };
          }) => ({
            instruction: step.instruction?.text || step.maneuver,
            distanceKm: Math.round((step.routeOffsetInMeters / 1000) * 10) / 10,
            durationMinutes: Math.round(step.travelTimeInSeconds / 60),
            maneuver: step.maneuver,
            coordinates: step.startPoint
              ? ([step.startPoint.longitude, step.startPoint.latitude] as [number, number])
              : ([0, 0] as [number, number]),
          })
        ),
      };
    }
  );

  // Push route results into the Journey Planner page and navigate there
  if (plannedJourneyCallback) {
    const recommendations =
      routes.length > 1
        ? [`Route 1 is the fastest option with estimated ${routes[0].durationInTrafficMinutes} minutes in current traffic.`]
        : [];
    plannedJourneyCallback({
      origin: {
        coordinates: { lat: args.origin_lat, lng: args.origin_lng },
        label: args.origin_label,
      },
      destination: {
        coordinates: { lat: args.destination_lat, lng: args.destination_lng },
        label: args.destination_label,
      },
      routes,
      recommendations,
    });
  }
  if (navigateCallback) {
    navigateCallback("/journey");
  }

  return {
    origin: args.origin_label,
    destination: args.destination_label,
    routes,
    routeCount: routes.length,
  };
}

async function handleGetTrafficIncidents(args: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<unknown> {
  const key = env.azureMapsKey;
  // Required params: style, boundingbox (minLat,minLon,maxLat,maxLon for EPSG4326), boundingZoom, trafficmodelid
  const url = `https://atlas.microsoft.com/traffic/incident/detail/json?api-version=1.0&subscription-key=${key}&style=s3&boundingbox=${args.south},${args.west},${args.north},${args.east}&boundingZoom=12&trafficmodelid=-1&projection=EPSG4326&language=da-DK`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps traffic failed: ${res.statusText}`);
  const data = await res.json();

  // Response format: { tm: { poi: [...] } }
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

  const incidents = pois
    .filter((poi) => !poi.cs || poi.cs === 0)
    .slice(0, 20)
    .map((poi) => ({
      id: poi.id || uuidv4(),
      title: poi.d || poi.c || "Traffic incident",
      description: [poi.d, poi.c, poi.f ? `From: ${poi.f}` : "", poi.t ? `To: ${poi.t}` : ""]
        .filter(Boolean)
        .join(" - "),
      location: {
        lat: poi.p.y,
        lng: poi.p.x,
      },
      severity: poi.ty >= 4 ? "critical" : poi.ty >= 3 ? "high" : poi.ty >= 2 ? "medium" : "low",
      type: poi.ic <= 1 ? "accident" : poi.ic <= 6 ? "other" : poi.ic <= 8 ? "closure" : poi.ic === 9 ? "roadwork" : "other",
      roadName: poi.r || "",
      delayMinutes: poi.dl ? Math.round(poi.dl / 60) : 0,
    }));

  return {
    incidents,
    totalCount: incidents.length,
    area: `${args.south.toFixed(2)},${args.west.toFixed(2)} to ${args.north.toFixed(2)},${args.east.toFixed(2)}`,
  };
}

function handleSaveJourney(args: {
  name: string;
  origin_label: string;
  origin_lat: number;
  origin_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  transport_mode?: string;
}): unknown {
  const journey: SavedJourney = {
    id: uuidv4(),
    name: args.name,
    origin: {
      coordinates: { lat: args.origin_lat, lng: args.origin_lng },
      label: args.origin_label,
    },
    destination: {
      coordinates: { lat: args.destination_lat, lng: args.destination_lng },
      label: args.destination_label,
    },
    preferences: {
      transportMode: (args.transport_mode as "car" | "transit" | "bicycle" | "walk") || "car",
      avoidTolls: false,
      avoidHighways: false,
    },
    morningAlert: null,
    createdAt: new Date().toISOString(),
  };
  storageService.saveJourney(journey);
  notifyJourneysChanged();
  return { success: true, journeyId: journey.id, name: journey.name };
}

function handleGetSavedJourneys(): unknown {
  const journeys = storageService.getSavedJourneys();
  return {
    journeys: journeys.map((j) => ({
      id: j.id,
      name: j.name,
      origin: j.origin.label,
      destination: j.destination.label,
      transportMode: j.preferences.transportMode,
      morningAlertEnabled: j.morningAlert?.enabled || false,
      createdAt: j.createdAt,
    })),
    totalCount: journeys.length,
  };
}

function handleDeleteSavedJourney(args: { journey_id: string }): unknown {
  storageService.deleteJourney(args.journey_id);
  notifyJourneysChanged();
  return { success: true, deletedId: args.journey_id };
}

const PAGE_ROUTES: Record<string, string> = {
  dashboard: "/",
  "journey-planner": "/journey",
  "saved-journeys": "/saved",
  notifications: "/notifications",
  settings: "/settings",
  shipments: "/shipments",
  "delivery-planner": "/delivery-planner",
  fleet: "/fleet",
  "work-orders": "/work-orders",
  inventory: "/inventory",
  analytics: "/analytics",
  scheduling: "/scheduling",
  tracking: "/tracking",
  maintenance: "/maintenance",
  returns: "/returns",
};

function handleNavigateToPage(args: { page: string }): unknown {
  const path = PAGE_ROUTES[args.page];
  if (path && navigateCallback) {
    navigateCallback(path);
    return { success: true, navigatedTo: args.page };
  }
  return { success: false, error: `Unknown page: ${args.page}` };
}

async function handleCompareRoutes(args: {
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  destination_lat: number;
  destination_lng: number;
  destination_label: string;
}): Promise<unknown> {
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

  // Get historical data
  const history = storageService.getRouteHistory();
  const matching = history.filter(
    (h) =>
      Math.abs(h.originLat - args.origin_lat) < 0.01 &&
      Math.abs(h.originLng - args.origin_lng) < 0.01 &&
      Math.abs(h.destinationLat - args.destination_lat) < 0.01 &&
      Math.abs(h.destinationLng - args.destination_lng) < 0.01
  );

  if (matching.length === 0) {
    return {
      current: {
        durationMinutes: currentDuration,
        durationInTrafficMinutes: currentDuration + currentDelay,
        trafficDelayMinutes: currentDelay,
        distanceKm: currentDistance,
      },
      history: null,
      message: "No historical data available for this route yet.",
    };
  }

  const avgDuration = Math.round(matching.reduce((s, h) => s + h.durationInTrafficMinutes, 0) / matching.length);
  const minDuration = Math.min(...matching.map((h) => h.durationInTrafficMinutes));
  const maxDuration = Math.max(...matching.map((h) => h.durationInTrafficMinutes));
  const avgDelay = Math.round(matching.reduce((s, h) => s + h.trafficDelayMinutes, 0) / matching.length);

  return {
    current: {
      durationMinutes: currentDuration,
      durationInTrafficMinutes: currentDuration + currentDelay,
      trafficDelayMinutes: currentDelay,
      distanceKm: currentDistance,
    },
    history: {
      totalTrips: matching.length,
      avgDurationMinutes: avgDuration,
      minDurationMinutes: minDuration,
      maxDurationMinutes: maxDuration,
      avgDelayMinutes: avgDelay,
    },
    comparison: {
      vsAverage: (currentDuration + currentDelay) - avgDuration,
      vsBest: (currentDuration + currentDelay) - minDuration,
      status: (currentDuration + currentDelay) <= avgDuration ? "better_than_average" : "worse_than_average",
    },
  };
}

function handleGetCommuteHistory(args: {
  journey_id?: string;
  limit?: number;
}): unknown {
  const limit = args.limit || 10;
  const history = storageService.getRouteHistory(args.journey_id);
  const entries = history.slice(0, limit);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      journeyId: e.journeyId,
      origin: e.originLabel,
      destination: e.destinationLabel,
      durationMinutes: e.durationMinutes,
      durationInTrafficMinutes: e.durationInTrafficMinutes,
      trafficDelayMinutes: e.trafficDelayMinutes,
      distanceKm: e.distanceKm,
      incidentCount: e.incidentCount,
      summary: e.summary,
      timestamp: e.timestamp,
    })),
    totalCount: history.length,
    returnedCount: entries.length,
  };
}

async function handleCheckCommuteStatus(args: {
  journey_id: string;
}): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find((j) => j.id === args.journey_id);
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

  // Get historical average
  const history = storageService.getRouteHistory(args.journey_id);
  const historicalAvg = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.durationInTrafficMinutes, 0) / history.length)
    : null;

  let recommendation: string;
  let action: string;
  if (delayRatio < 0.1) {
    recommendation = "Traffic is clear. Great time to leave!";
    action = "leave_now";
  } else if (delayRatio < 0.3) {
    recommendation = `Moderate delays (+${trafficDelay} min). Within normal range — fine to leave now.`;
    action = "leave_now";
  } else if (delayRatio < 0.6) {
    recommendation = `Significant delays (+${trafficDelay} min). Consider waiting 15-30 minutes for traffic to ease.`;
    action = "wait";
  } else {
    recommendation = `Heavy delays (+${trafficDelay} min). Consider an alternative route or waiting.`;
    action = "consider_alternative";
  }

  return {
    journey: { id: journey.id, name: journey.name },
    current: {
      baseDurationMinutes: baseDuration,
      trafficDelayMinutes: trafficDelay,
      totalDurationMinutes: totalDuration,
      delayPercentage: Math.round(delayRatio * 100),
    },
    historicalAvgMinutes: historicalAvg,
    recommendation,
    action,
  };
}

async function handleMonitorSavedJourney(args: {
  journey_id: string;
}): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find((j) => j.id === args.journey_id);
  if (!journey) return { error: `Journey not found: ${args.journey_id}` };

  const bounds = computeCorridorBounds(
    journey.origin.coordinates.lat,
    journey.origin.coordinates.lng,
    journey.destination.coordinates.lat,
    journey.destination.coordinates.lng
  );

  const incidents = await fetchCorridorIncidents(bounds);
  const status = classifyStatus(incidents);

  // Also fetch current route duration
  const key = env.azureMapsKey;
  const { origin, destination } = journey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest`;

  let currentDuration = 0;
  let trafficDelay = 0;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (route) {
        currentDuration = Math.round(route.summary.travelTimeInSeconds / 60);
        trafficDelay = Math.round(route.summary.trafficDelayInSeconds / 60);
      }
    }
  } catch {
    // Continue with incidents only
  }

  return {
    journey: { id: journey.id, name: journey.name },
    status,
    incidents: incidents.map((i) => ({
      title: i.title,
      severity: i.severity,
      type: i.type,
      roadName: i.roadName,
      delayMinutes: i.delayMinutes,
    })),
    incidentCount: incidents.length,
    currentDurationMinutes: currentDuration,
    trafficDelayMinutes: trafficDelay,
    lastChecked: new Date().toISOString(),
  };
}

async function handleMonitorAllJourneys(): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  if (journeys.length === 0) return { journeys: [], message: "No saved journeys found." };

  const results = await Promise.all(
    journeys.map(async (journey) => {
      const bounds = computeCorridorBounds(
        journey.origin.coordinates.lat,
        journey.origin.coordinates.lng,
        journey.destination.coordinates.lat,
        journey.destination.coordinates.lng
      );
      const incidents = await fetchCorridorIncidents(bounds);
      const status = classifyStatus(incidents);
      return {
        id: journey.id,
        name: journey.name,
        origin: journey.origin.label,
        destination: journey.destination.label,
        status,
        incidentCount: incidents.length,
        criticalCount: incidents.filter((i) => i.severity === "critical").length,
        highCount: incidents.filter((i) => i.severity === "high").length,
      };
    })
  );

  return {
    journeys: results,
    totalJourneys: results.length,
    lastChecked: new Date().toISOString(),
  };
}

async function handleSuggestReroute(args: {
  journey_id: string;
}): Promise<unknown> {
  const journeys = storageService.getSavedJourneys();
  const journey = journeys.find((j) => j.id === args.journey_id);
  if (!journey) return { error: `Journey not found: ${args.journey_id}` };

  const key = env.azureMapsKey;
  const { origin, destination } = journey;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest&instructionsType=text&maxAlternatives=3`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route failed: ${res.statusText}`);
  const data = await res.json();

  const routes = (data.routes || []).map(
    (route: {
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
    ) => ({
      index: idx + 1,
      durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
      durationInTrafficMinutes: Math.round(
        (route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60
      ),
      distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
      trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
      isOriginal: idx === 0,
    })
  );

  if (routes.length <= 1) {
    return {
      journey: { id: journey.id, name: journey.name },
      originalRoute: routes[0] || null,
      alternatives: [],
      message: "No alternative routes available.",
    };
  }

  const original = routes[0];
  const alternatives = routes.slice(1).map(
    (alt: { index: number; durationMinutes: number; durationInTrafficMinutes: number; distanceKm: number; trafficDelayMinutes: number }) => {
      const comparison = compareRoutes(
        {
          durationMinutes: original.durationMinutes,
          durationInTrafficMinutes: original.durationInTrafficMinutes,
          distanceKm: original.distanceKm,
          trafficDelayMinutes: original.trafficDelayMinutes,
        },
        {
          durationMinutes: alt.durationMinutes,
          durationInTrafficMinutes: alt.durationInTrafficMinutes,
          distanceKm: alt.distanceKm,
          trafficDelayMinutes: alt.trafficDelayMinutes,
        }
      );
      return { ...alt, comparison };
    }
  );

  // Find best alternative
  const bestAlt = alternatives.reduce(
    (best: typeof alternatives[0] | null, alt: typeof alternatives[0]) =>
      !best || alt.durationInTrafficMinutes < best.durationInTrafficMinutes ? alt : best,
    null
  );

  // Push to journey planner if the best alternative saves significant time
  if (bestAlt && bestAlt.comparison.recommendation === "take_alternative" && plannedJourneyCallback) {
    // Re-fetch with full route data for the planner
    const fullUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin.coordinates.lat},${origin.coordinates.lng}:${destination.coordinates.lat},${destination.coordinates.lng}&travelMode=car&traffic=true&routeType=fastest&instructionsType=text&maxAlternatives=3`;
    const fullRes = await fetch(fullUrl);
    if (fullRes.ok) {
      const fullData = await fullRes.json();
      const fullRoutes = (fullData.routes || []).map(
        (route: {
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
            (p: { latitude: number; longitude: number }) => [p.longitude, p.latitude] as [number, number]
          );
          return {
            id: uuidv4(),
            summary: `Route ${idx + 1}`,
            durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
            durationInTrafficMinutes: Math.round(
              (route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60
            ),
            distanceKm: Math.round((route.summary.lengthInMeters / 1000) * 10) / 10,
            departureTime: route.summary.departureTime || new Date().toISOString(),
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
                distanceKm: Math.round((step.routeOffsetInMeters / 1000) * 10) / 10,
                durationMinutes: Math.round(step.travelTimeInSeconds / 60),
                maneuver: step.maneuver,
                coordinates: step.startPoint
                  ? ([step.startPoint.longitude, step.startPoint.latitude] as [number, number])
                  : ([0, 0] as [number, number]),
              })
            ),
            trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
            incidents: [] as [],
            isRecommended: idx === 0,
          };
        }
      );

      plannedJourneyCallback({
        origin: { coordinates: origin.coordinates, label: origin.label },
        destination: { coordinates: destination.coordinates, label: destination.label },
        routes: fullRoutes,
        recommendations: [`Alternative route saves ${bestAlt.comparison.timeSavedMinutes} minutes.`],
      });

      if (navigateCallback) {
        navigateCallback("/journey");
      }
    }
  }

  return {
    journey: { id: journey.id, name: journey.name },
    originalRoute: original,
    alternatives,
    bestAlternative: bestAlt,
    recommendation: bestAlt?.comparison.recommendation || "keep_original",
  };
}

// --- Supply Chain Tool Handlers ---

async function handleGetWarehouseShipments(args: {
  warehouse_id?: string;
  status?: string;
}): Promise<unknown> {
  const shipments = await d365McpClient.getWarehouseShipments(args.warehouse_id, args.status);
  return {
    shipments: shipments.map(s => ({
      shipmentId: s.shipmentId,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouseName,
      origin: s.origin.label,
      destination: s.destination.label,
      customerName: s.customerName,
      status: s.status,
      scheduledDate: s.scheduledDate,
      estimatedArrival: s.estimatedArrival,
      totalWeight: s.totalWeight,
      itemCount: s.items.length,
      currentTrafficDelay: s.currentTrafficDelay,
      routeDistanceKm: s.routeDistanceKm,
      routeDurationMinutes: s.routeDurationMinutes,
      priority: s.priority,
    })),
    totalCount: shipments.length,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetDeliverySchedule(args: {
  start_date: string;
  end_date: string;
  warehouse_id?: string;
}): Promise<unknown> {
  const shipments = await d365McpClient.getDeliverySchedule(args.start_date, args.end_date, args.warehouse_id);
  return {
    schedule: shipments.map(s => ({
      shipmentId: s.shipmentId,
      warehouseId: s.warehouseId,
      destination: s.destination.label,
      customerName: s.customerName,
      scheduledDate: s.scheduledDate,
      status: s.status,
      priority: s.priority,
    })),
    dateRange: { start: args.start_date, end: args.end_date },
    totalCount: shipments.length,
  };
}

async function handleOptimizeDeliveryRoute(args: {
  warehouse_id: string;
  shipment_ids: string[];
}): Promise<unknown> {
  // Get all shipments
  const allShipments = await d365McpClient.getWarehouseShipments(args.warehouse_id);
  const selectedShipments = allShipments.filter(s =>
    args.shipment_ids.includes(s.shipmentId) || args.shipment_ids.includes(s.id)
  );

  if (selectedShipments.length === 0) {
    return { error: "No matching shipments found for the given IDs" };
  }

  // Get warehouse as origin
  const warehouses = await d365McpClient.getWarehouses();
  const warehouse = warehouses.find(w => w.id === args.warehouse_id);
  if (!warehouse) {
    return { error: `Warehouse ${args.warehouse_id} not found` };
  }

  // Build waypoints for Azure Maps Route optimization
  const key = env.azureMapsKey;
  const origin = warehouse.location.coordinates;

  // Create the route query: origin → all destinations (Azure Maps will optimize order)
  const waypoints = selectedShipments.map(s => `${s.destination.coordinates.lat},${s.destination.coordinates.lng}`);
  const query = `${origin.lat},${origin.lng}:${waypoints.join(":")}`;

  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${query}&travelMode=car&traffic=true&routeType=fastest&computeBestOrder=true&instructionsType=text`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route optimization failed: ${res.statusText}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return { error: "No optimized route found" };

  const optimizedOrder: number[] = route.optimizedWaypoints?.map(
    (wp: { providedIndex: number; optimizedIndex: number }) => wp.optimizedIndex
  ) || selectedShipments.map((_, i) => i);

  const totalDistance = Math.round((route.summary.lengthInMeters / 1000) * 10) / 10;
  const totalDuration = Math.round(route.summary.travelTimeInSeconds / 60);
  const trafficDelay = Math.round(route.summary.trafficDelayInSeconds / 60);

  // Build ordered stops
  const orderedStops = optimizedOrder.map((originalIdx: number, order: number) => {
    const shipment = selectedShipments[originalIdx] || selectedShipments[order];
    return {
      stopOrder: order + 1,
      shipmentId: shipment?.shipmentId || `Unknown-${order}`,
      destination: shipment?.destination.label || "Unknown",
      customerName: shipment?.customerName || "Unknown",
    };
  });

  // Navigate to delivery planner
  if (navigateCallback) {
    navigateCallback("/delivery-planner");
  }

  return {
    origin: warehouse.name,
    stops: orderedStops,
    totalStops: selectedShipments.length,
    totalDistanceKm: totalDistance,
    totalDurationMinutes: totalDuration + trafficDelay,
    trafficDelayMinutes: trafficDelay,
    optimizationApplied: true,
    dataSource: d365McpClient.isConnected() ? "D365 F&O + Azure Maps" : "Demo Data + Azure Maps",
  };
}

async function handleCheckShipmentStatus(args: {
  shipment_id: string;
}): Promise<unknown> {
  const shipment = await d365McpClient.checkShipmentStatus(args.shipment_id);
  if (!shipment) {
    return { error: `Shipment not found: ${args.shipment_id}` };
  }

  // Check traffic along the route
  const bounds = computeCorridorBounds(
    shipment.origin.coordinates.lat,
    shipment.origin.coordinates.lng,
    shipment.destination.coordinates.lat,
    shipment.destination.coordinates.lng
  );
  const incidents = await fetchCorridorIncidents(bounds);
  const trafficStatus = classifyStatus(incidents);

  return {
    shipment: {
      shipmentId: shipment.shipmentId,
      status: shipment.status,
      origin: shipment.origin.label,
      destination: shipment.destination.label,
      customerName: shipment.customerName,
      scheduledDate: shipment.scheduledDate,
      estimatedArrival: shipment.estimatedArrival,
      priority: shipment.priority,
      totalWeight: shipment.totalWeight,
      items: shipment.items.map(i => ({ name: i.itemName, quantity: i.quantity, unit: i.unit })),
    },
    trafficStatus,
    incidentCount: incidents.length,
    incidents: incidents.slice(0, 5).map(i => ({
      title: i.title,
      severity: i.severity,
      type: i.type,
      delayMinutes: i.delayMinutes,
    })),
    currentTrafficDelay: shipment.currentTrafficDelay,
    lastChecked: new Date().toISOString(),
  };
}

async function handleUpdateShipmentEta(args: {
  shipment_id: string;
  new_eta: string;
}): Promise<unknown> {
  const success = await d365McpClient.updateShipmentEta(args.shipment_id, args.new_eta);
  return {
    success,
    shipmentId: args.shipment_id,
    newEta: args.new_eta,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
    message: success
      ? `ETA updated to ${args.new_eta} for shipment ${args.shipment_id}`
      : `Failed to update ETA for shipment ${args.shipment_id}`,
  };
}

async function handleGetWarehouseInventory(args: {
  warehouse_id: string;
}): Promise<unknown> {
  const inventory = await d365McpClient.getWarehouseInventory(args.warehouse_id);
  const warehouses = await d365McpClient.getWarehouses();
  const warehouse = warehouses.find(w => w.id === args.warehouse_id);

  return {
    warehouseId: args.warehouse_id,
    warehouseName: warehouse?.name || args.warehouse_id,
    items: inventory.map(i => ({
      itemId: i.itemId,
      itemName: i.itemName,
      onHand: i.quantityOnHand,
      reserved: i.quantityReserved,
      available: i.quantityAvailable,
      unit: i.unit,
      belowReorderPoint: i.reorderPoint ? i.quantityAvailable < i.reorderPoint : false,
    })),
    totalItems: inventory.length,
    itemsBelowReorder: inventory.filter(i => i.reorderPoint && i.quantityAvailable < i.reorderPoint).length,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

// --- New Industry Tool Handlers ---

async function handleGetInventoryAlerts(): Promise<unknown> {
  const alerts = await d365McpClient.getInventoryAlerts();
  const warehouses = await d365McpClient.getWarehouses();
  return {
    alerts: alerts.map(i => {
      const wh = warehouses.find(w => w.id === i.warehouseId);
      return {
        itemId: i.itemId,
        itemName: i.itemName,
        warehouseId: i.warehouseId,
        warehouseName: wh?.name || i.warehouseId,
        available: i.quantityAvailable,
        reorderPoint: i.reorderPoint,
        deficit: (i.reorderPoint || 0) - i.quantityAvailable,
        unit: i.unit,
      };
    }),
    totalAlerts: alerts.length,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetFleetStatus(): Promise<unknown> {
  const vehicles = await d365McpClient.getFleetStatus();
  const inTransit = vehicles.filter(v => v.status === "in_transit").length;
  const idle = vehicles.filter(v => v.status === "idle").length;
  const maintenance = vehicles.filter(v => v.status === "maintenance").length;
  return {
    vehicles: vehicles.map(v => ({
      vehicleId: v.vehicleId,
      licensePlate: v.licensePlate,
      driverName: v.driverName,
      status: v.status,
      location: v.currentLocation.label,
      assignedRoute: v.assignedRoute || "None",
      currentShipmentId: v.currentShipmentId || "None",
      loadPercent: v.loadPercent,
      speedKmh: v.speedKmh,
      fuelLevelPercent: v.fuelLevelPercent,
    })),
    summary: { total: vehicles.length, inTransit, idle, maintenance, returning: vehicles.length - inTransit - idle - maintenance },
    fleetUtilization: Math.round((inTransit / vehicles.length) * 100),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetDriverPerformance(args: { driver_id?: string }): Promise<unknown> {
  const vehicles = await d365McpClient.getFleetStatus();
  const filtered = args.driver_id
    ? vehicles.filter(v => v.driverId === args.driver_id)
    : vehicles;
  return {
    drivers: filtered.map(v => ({
      driverId: v.driverId,
      driverName: v.driverName,
      vehicleId: v.vehicleId,
      status: v.status,
      hoursOnDuty: v.hoursOnDuty,
      distanceTodayKm: v.distanceTodayKm,
      currentSpeed: v.speedKmh,
      fuelLevel: v.fuelLevelPercent,
      currentLocation: v.currentLocation.label,
    })),
    totalDrivers: filtered.length,
  };
}

async function handleGetWorkOrders(args: { status?: string }): Promise<unknown> {
  const workOrders = await d365McpClient.getWorkOrders(args.status);
  return {
    workOrders: workOrders.map(wo => ({
      workOrderId: wo.workOrderId,
      customerName: wo.customerName,
      serviceType: wo.serviceType,
      priority: wo.priority,
      status: wo.status,
      location: wo.location.label,
      estimatedDuration: wo.estimatedDuration,
      scheduledDate: wo.scheduledDate || "Unscheduled",
      assignedTechnicianId: wo.assignedTechnicianId || "Unassigned",
      requiredSkills: wo.requiredSkills,
      description: wo.description,
    })),
    totalCount: workOrders.length,
    dataSource: d365McpClient.isConnected() ? "D365 Field Service" : "Demo Data",
  };
}

async function handleGetTechnicianAvailability(): Promise<unknown> {
  const technicians = await d365McpClient.getTechnicians();
  return {
    technicians: technicians.map(t => ({
      id: t.id,
      name: t.name,
      skills: t.skills,
      status: t.status,
      location: t.currentLocation.label,
      todayWorkOrders: t.todayWorkOrders,
      completedToday: t.completedToday,
    })),
    available: technicians.filter(t => t.status === "available").length,
    onJob: technicians.filter(t => t.status === "on_job").length,
    offDuty: technicians.filter(t => t.status === "off_duty").length,
    totalCount: technicians.length,
  };
}

async function handleAssignWorkOrder(args: {
  work_order_id: string;
  technician_id: string;
}): Promise<unknown> {
  const workOrders = await d365McpClient.getWorkOrders();
  const wo = workOrders.find(w => w.workOrderId === args.work_order_id || w.id === args.work_order_id);
  if (!wo) return { success: false, error: `Work order not found: ${args.work_order_id}` };

  const technicians = await d365McpClient.getTechnicians();
  const tech = technicians.find(t => t.id === args.technician_id);
  if (!tech) return { success: false, error: `Technician not found: ${args.technician_id}` };

  // Check skill match
  const missingSkills = wo.requiredSkills.filter(s => !tech.skills.includes(s));
  if (missingSkills.length > 0) {
    return {
      success: false,
      error: `Technician ${tech.name} is missing required skills: ${missingSkills.join(", ")}`,
      technicianSkills: tech.skills,
      requiredSkills: wo.requiredSkills,
    };
  }

  const success = await d365McpClient.assignWorkOrder(wo.workOrderId, args.technician_id);
  return {
    success,
    workOrderId: wo.workOrderId,
    assignedTo: tech.name,
    technicianId: tech.id,
    message: success
      ? `Work order ${wo.workOrderId} assigned to ${tech.name}`
      : `Failed to assign work order`,
  };
}

async function handleGetSupplyChainKPIs(): Promise<unknown> {
  const kpis = await d365McpClient.getSupplyChainKPIs();
  return {
    kpis,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
    generatedAt: new Date().toISOString(),
  };
}

async function handleGetExceptionAlerts(): Promise<unknown> {
  const alerts = await d365McpClient.getExceptionAlerts();
  return {
    alerts: alerts.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      relatedEntityId: a.relatedEntityId,
      timestamp: a.timestamp,
    })),
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.severity === "critical").length,
    highCount: alerts.filter(a => a.severity === "high").length,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

// --- Phase 3: Scheduling, Tracking, Maintenance, Returns Handlers ---

async function handleGetScheduleBoard(): Promise<unknown> {
  const board = await d365McpClient.getScheduleBoard();
  return {
    technicians: board.technicians.map(t => ({
      id: t.id,
      name: t.name,
      skills: t.skills,
      status: t.status,
      location: t.currentLocation.label,
    })),
    slots: board.slots.map(s => ({
      workOrderId: s.workOrderId,
      technicianId: s.technicianId,
      startHour: s.startHour,
      durationHours: s.durationHours,
      priority: s.priority,
      customerName: s.customerName,
      serviceType: s.serviceType,
    })),
    unscheduledWorkOrders: board.unscheduledWorkOrders.map(wo => ({
      workOrderId: wo.workOrderId,
      customerName: wo.customerName,
      serviceType: wo.serviceType,
      priority: wo.priority,
      requiredSkills: wo.requiredSkills,
      estimatedDuration: wo.estimatedDuration,
      location: wo.location.label,
    })),
    scheduledCount: board.slots.length,
    unscheduledCount: board.unscheduledWorkOrders.length,
    techniciansOnDuty: board.technicians.filter(t => t.status !== "off_duty").length,
    dataSource: d365McpClient.isConnected() ? "D365 Field Service" : "Demo Data",
  };
}

async function handleOptimizeSchedule(args: { work_order_id: string }): Promise<unknown> {
  const board = await d365McpClient.getScheduleBoard();
  const technicians = await d365McpClient.getTechnicians();
  const workOrders = await d365McpClient.getWorkOrders();
  const wo = workOrders.find(w => w.workOrderId === args.work_order_id || w.id === args.work_order_id);
  if (!wo) return { error: `Work order not found: ${args.work_order_id}` };

  // Score each available technician
  const candidates = technicians
    .filter(t => t.status === "available" || t.status === "on_job")
    .map(t => {
      const skillMatch = wo.requiredSkills.filter(s => t.skills.includes(s)).length;
      const skillTotal = wo.requiredSkills.length;
      const skillScore = skillTotal > 0 ? (skillMatch / skillTotal) * 100 : 100;
      const existingSlots = board.slots.filter(s => s.technicianId === t.id).length;
      const availabilityScore = Math.max(0, 100 - existingSlots * 25);
      const overallScore = Math.round(skillScore * 0.6 + availabilityScore * 0.4);
      return {
        technicianId: t.id,
        technicianName: t.name,
        skills: t.skills,
        matchingSkills: wo.requiredSkills.filter(s => t.skills.includes(s)),
        missingSkills: wo.requiredSkills.filter(s => !t.skills.includes(s)),
        skillScore: Math.round(skillScore),
        availabilityScore,
        overallScore,
        existingAssignments: existingSlots,
        location: t.currentLocation.label,
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  return {
    workOrder: { id: wo.workOrderId, customerName: wo.customerName, requiredSkills: wo.requiredSkills, priority: wo.priority },
    recommendations: candidates.slice(0, 3),
    bestMatch: candidates[0] || null,
    message: candidates.length > 0
      ? `Best match: ${candidates[0].technicianName} (score: ${candidates[0].overallScore}%)`
      : "No available technicians with matching skills",
  };
}

async function handleTrackShipment(args: { shipment_id: string }): Promise<unknown> {
  const tracking = await d365McpClient.getShipmentTracking(args.shipment_id);
  if (!tracking) {
    return { error: `No tracking data found for shipment: ${args.shipment_id}` };
  }
  const shipment = await d365McpClient.checkShipmentStatus(args.shipment_id);
  return {
    shipmentId: tracking.shipmentId,
    status: shipment?.status || "unknown",
    origin: shipment?.origin.label,
    destination: shipment?.destination.label,
    customerName: shipment?.customerName,
    events: tracking.events,
    currentLocation: tracking.currentLocation?.label || null,
    estimatedDelivery: tracking.estimatedDelivery,
    hasProofOfDelivery: !!tracking.proofOfDelivery,
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetProofOfDelivery(args: { shipment_id: string }): Promise<unknown> {
  const tracking = await d365McpClient.getShipmentTracking(args.shipment_id);
  if (!tracking) {
    return { error: `No tracking data found for shipment: ${args.shipment_id}` };
  }
  if (!tracking.proofOfDelivery) {
    return {
      shipmentId: args.shipment_id,
      delivered: false,
      message: "Shipment has not been delivered yet. No proof of delivery available.",
    };
  }
  return {
    shipmentId: args.shipment_id,
    delivered: true,
    proofOfDelivery: {
      signatureCollected: tracking.proofOfDelivery.signature,
      photoTaken: tracking.proofOfDelivery.photo,
      deliveryTimestamp: tracking.proofOfDelivery.timestamp,
    },
  };
}

async function handleGetVehicleHealth(): Promise<unknown> {
  const vehicles = await d365McpClient.getVehicleHealth();
  const critical = vehicles.filter(v => v.healthScore < 50).length;
  const warning = vehicles.filter(v => v.healthScore >= 50 && v.healthScore < 75).length;
  const healthy = vehicles.filter(v => v.healthScore >= 75).length;
  return {
    vehicles: vehicles.map(v => ({
      vehicleId: v.vehicleId,
      licensePlate: v.licensePlate,
      healthScore: v.healthScore,
      lastServiceDate: v.lastServiceDate,
      nextPredictedService: v.nextPredictedService,
      mileageKm: v.mileageKm,
      engineHours: v.engineHours,
      alertCount: v.alerts.length,
      criticalAlerts: v.alerts.filter(a => a.severity === "critical").length,
    })),
    summary: { total: vehicles.length, critical, warning, healthy },
    avgHealthScore: Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length),
    totalAlerts: vehicles.reduce((s, v) => s + v.alerts.length, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetMaintenanceAlerts(): Promise<unknown> {
  const alerts = await d365McpClient.getMaintenanceAlerts();
  return {
    alerts: alerts.map(a => ({
      id: a.id,
      vehicleId: a.vehicleId,
      component: a.component,
      severity: a.severity,
      predictedFailureDate: a.predictedFailureDate,
      confidencePercent: a.confidencePercent,
      recommendedAction: a.recommendedAction,
      estimatedCost: a.estimatedCost,
    })),
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.severity === "critical").length,
    highCount: alerts.filter(a => a.severity === "high").length,
    totalEstimatedCost: alerts.reduce((s, a) => s + a.estimatedCost, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetMaintenanceHistory(args: { vehicle_id?: string }): Promise<unknown> {
  const records = await d365McpClient.getMaintenanceHistory(args.vehicle_id);
  return {
    records: records.map(r => ({
      id: r.id,
      vehicleId: r.vehicleId,
      serviceType: r.serviceType,
      date: r.date,
      cost: r.cost,
      technician: r.technician,
      notes: r.notes,
    })),
    totalRecords: records.length,
    totalCost: records.reduce((s, r) => s + r.cost, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetReturns(args: { status?: string }): Promise<unknown> {
  const returns = await d365McpClient.getReturns(args.status);
  return {
    returns: returns.map(r => ({
      returnId: r.returnId,
      originalShipmentId: r.originalShipmentId,
      customerName: r.customerName,
      reason: r.reason,
      status: r.status,
      items: r.items.map(i => ({ itemName: i.itemName, quantity: i.quantity, condition: i.condition })),
      requestedDate: r.requestedDate,
      pickupDate: r.pickupDate || "Not scheduled",
      refundAmount: r.refundAmount,
      warehouseId: r.warehouseId,
      notes: r.notes,
    })),
    totalCount: returns.length,
    totalRefundAmount: returns.reduce((s, r) => s + r.refundAmount, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleApproveReturn(args: { return_id: string }): Promise<unknown> {
  const returns = await d365McpClient.getReturns();
  const ret = returns.find(r => r.returnId === args.return_id || r.id === args.return_id);
  if (!ret) return { success: false, error: `Return not found: ${args.return_id}` };
  if (ret.status !== "requested") {
    return { success: false, error: `Return ${args.return_id} is in '${ret.status}' status, can only approve 'requested' returns` };
  }
  const success = await d365McpClient.approveReturn(ret.returnId);
  return {
    success,
    returnId: ret.returnId,
    customerName: ret.customerName,
    message: success
      ? `Return ${ret.returnId} approved. Pickup will be scheduled.`
      : `Failed to approve return ${ret.returnId}`,
  };
}

/** Execute a tool call by name and return the result as a JSON string */
export async function executeToolCall(
  name: string,
  argsJson: string
): Promise<string> {
  const args = JSON.parse(argsJson || "{}");
  let result: unknown;

  switch (name) {
    case "search_location":
      result = await handleSearchLocation(args);
      break;
    case "plan_journey":
      result = await handlePlanJourney(args);
      break;
    case "get_traffic_incidents":
      result = await handleGetTrafficIncidents(args);
      break;
    case "save_journey":
      result = handleSaveJourney(args);
      break;
    case "get_saved_journeys":
      result = handleGetSavedJourneys();
      break;
    case "delete_saved_journey":
      result = handleDeleteSavedJourney(args);
      break;
    case "navigate_to_page":
      result = handleNavigateToPage(args);
      break;
    case "compare_routes":
      result = await handleCompareRoutes(args);
      break;
    case "get_commute_history":
      result = handleGetCommuteHistory(args);
      break;
    case "check_commute_status":
      result = await handleCheckCommuteStatus(args);
      break;
    case "monitor_saved_journey":
      result = await handleMonitorSavedJourney(args);
      break;
    case "monitor_all_journeys":
      result = await handleMonitorAllJourneys();
      break;
    case "suggest_reroute":
      result = await handleSuggestReroute(args);
      break;
    case "show_input_form":
      // The card rendering is handled by the UI via tool call arguments.
      // This handler just acknowledges the tool call.
      result = { displayed: true, message: "Form displayed to user. Wait for their response." };
      break;
    // Supply Chain Tools
    case "get_warehouse_shipments":
      result = await handleGetWarehouseShipments(args);
      break;
    case "get_delivery_schedule":
      result = await handleGetDeliverySchedule(args);
      break;
    case "optimize_delivery_route":
      result = await handleOptimizeDeliveryRoute(args);
      break;
    case "check_shipment_status":
      result = await handleCheckShipmentStatus(args);
      break;
    case "update_shipment_eta":
      result = await handleUpdateShipmentEta(args);
      break;
    case "get_warehouse_inventory":
      result = await handleGetWarehouseInventory(args);
      break;
    case "get_inventory_alerts":
      result = await handleGetInventoryAlerts();
      break;
    case "get_fleet_status":
      result = await handleGetFleetStatus();
      break;
    case "get_driver_performance":
      result = await handleGetDriverPerformance(args);
      break;
    case "get_work_orders":
      result = await handleGetWorkOrders(args);
      break;
    case "get_technician_availability":
      result = await handleGetTechnicianAvailability();
      break;
    case "assign_work_order":
      result = await handleAssignWorkOrder(args);
      break;
    case "get_supply_chain_kpis":
      result = await handleGetSupplyChainKPIs();
      break;
    case "get_exception_alerts":
      result = await handleGetExceptionAlerts();
      break;
    // Phase 3: Scheduling, Tracking, Maintenance, Returns
    case "get_schedule_board":
      result = await handleGetScheduleBoard();
      break;
    case "optimize_schedule":
      result = await handleOptimizeSchedule(args);
      break;
    case "track_shipment":
      result = await handleTrackShipment(args);
      break;
    case "get_proof_of_delivery":
      result = await handleGetProofOfDelivery(args);
      break;
    case "get_vehicle_health":
      result = await handleGetVehicleHealth();
      break;
    case "get_maintenance_alerts":
      result = await handleGetMaintenanceAlerts();
      break;
    case "get_maintenance_history":
      result = await handleGetMaintenanceHistory(args);
      break;
    case "get_returns":
      result = await handleGetReturns(args);
      break;
    case "approve_return":
      result = await handleApproveReturn(args);
      break;
    default:
      result = { error: `Unknown tool: ${name}` };
  }

  return JSON.stringify(result);
}
