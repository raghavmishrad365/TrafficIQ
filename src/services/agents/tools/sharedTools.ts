import type { OpenAIToolDefinition } from "../../agentTools";

// --- Shared callbacks used by multiple agent tool handlers ---

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

export function getNavigateCallback(): NavigateCallback | null {
  return navigateCallback;
}

export function getPlannedJourneyCallback(): PlannedJourneyCallback | null {
  return plannedJourneyCallback;
}

// --- Page routes mapping ---

export const PAGE_ROUTES: Record<string, string> = {
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
  "iot-devices": "/iot-devices",
};

// --- Shared tool definitions ---

export const sharedToolDefinitions: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "navigate_to_page",
      description:
        "Navigate the user to a specific page in the app. Available pages: dashboard, shipments, delivery-planner, fleet, work-orders, inventory, analytics, scheduling, tracking, maintenance, returns, journey-planner, saved-journeys, notifications, settings, iot-devices.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: [
              "dashboard", "shipments", "delivery-planner", "fleet",
              "work-orders", "inventory", "analytics", "scheduling",
              "tracking", "maintenance", "returns", "journey-planner",
              "saved-journeys", "notifications", "settings", "iot-devices",
            ],
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
      name: "show_input_form",
      description:
        "Display an interactive Adaptive Card form in the chat to collect user input. Use this whenever you need to gather information from the user. The form will be rendered as an interactive card. You MUST call this tool instead of asking questions in plain text.",
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
              'An Adaptive Card payload object. Must have "type": "AdaptiveCard", "version": "1.5", a "body" array, and an "actions" array.',
            properties: {
              type: { type: "string", description: 'Must be "AdaptiveCard"' },
              version: { type: "string", description: 'Must be "1.5"' },
              body: { type: "array", description: "Array of card elements", items: { type: "object", additionalProperties: true } },
              actions: { type: "array", description: "Array of actions", items: { type: "object", additionalProperties: true } },
            },
            required: ["type", "version", "body", "actions"],
          },
        },
        required: ["title", "card"],
      },
    },
  },
];

// --- Shared tool handlers ---

export function handleNavigateToPage(args: { page: string }): unknown {
  const path = PAGE_ROUTES[args.page];
  if (path && navigateCallback) {
    navigateCallback(path);
    return { success: true, navigatedTo: args.page };
  }
  return { success: false, error: `Unknown page: ${args.page}` };
}

export function handleShowInputForm(): unknown {
  return { displayed: true, message: "Form displayed to user. Wait for their response." };
}

/** Execute shared tools. Returns null if the tool name is not a shared tool. */
export async function executeSharedTool(name: string, argsJson: string): Promise<string | null> {
  const args = JSON.parse(argsJson || "{}");
  switch (name) {
    case "navigate_to_page":
      return JSON.stringify(handleNavigateToPage(args));
    case "show_input_form":
      return JSON.stringify(handleShowInputForm());
    default:
      return null;
  }
}
