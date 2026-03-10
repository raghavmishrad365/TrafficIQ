// --- Multi-Agent Registry: types, configs, display metadata, routing keywords ---

export type AgentDomain = "orchestrator" | "traffic" | "supplychain" | "fleet" | "operations" | "fieldservice" | "iotlogistics";

export interface AgentConfig {
  domain: AgentDomain;
  name: string;
  displayName: string;
  subtitle: string;
  color: string;
  /** Fluent UI icon name hint — actual icon mapped in UI component */
  iconHint: string;
  /** Keywords for fast deterministic routing (Tier 2) */
  keywords: string[];
}

/** Configs for the 6 specialist agents */
export const AGENT_CONFIGS: Record<Exclude<AgentDomain, "orchestrator">, AgentConfig> = {
  traffic: {
    domain: "traffic",
    name: "TrafficIQ Traffic Agent",
    displayName: "Traffic",
    subtitle: "Routes, traffic & journeys",
    color: "#0078D4", // blue
    iconHint: "VehicleCar",
    keywords: [
      "route", "traffic", "journey", "commute", "drive", "driving",
      "incident", "direction", "reroute", "re-route", "alternative route",
      "congestion", "accident", "roadwork", "road work", "closure",
      "delay", "detour", "fastest route", "travel time",
      "saved journey", "saved route", "morning commute", "monitor",
      "search location", "geocode", "plan journey", "compare routes",
      "truck route", "weather", "gas station", "rest area", "poi",
      "reachable range", "isochrone", "snap to road",
    ],
  },
  supplychain: {
    domain: "supplychain",
    name: "TrafficIQ Supply Chain Agent",
    displayName: "Supply Chain",
    subtitle: "Shipments, deliveries & inventory",
    color: "#107C10", // green
    iconHint: "BoxMultiple",
    keywords: [
      "shipment", "delivery", "deliveries", "warehouse", "inventory",
      "stock", "eta", "kpi", "kpis", "analytics",
      "order", "supply chain", "supply-chain", "logistics",
      "exception", "alert", "reorder", "tracking", "track shipment",
      "proof of delivery", "pod", "packed", "in transit", "in-transit",
      "delayed", "optimize delivery", "delivery route", "delivery plan",
      "DK01", "DK02", "DK03",
    ],
  },
  fleet: {
    domain: "fleet",
    name: "TrafficIQ Fleet Agent",
    displayName: "Fleet",
    subtitle: "Vehicles, drivers & maintenance",
    color: "#CA5010", // orange
    iconHint: "VehicleTruckProfile",
    keywords: [
      "fleet", "vehicle", "vehicles", "driver", "drivers", "truck",
      "fuel", "maintenance", "health", "engine", "mileage",
      "breakdown", "repair", "service", "tire", "brake", "oil",
      "speed", "gps", "location", "license plate",
      "vehicle health", "fleet status", "driver performance",
      "predictive maintenance", "maintenance alert", "maintenance history",
      "reachable range", "fuel range", "snap gps", "road name", "speed limit", "clustering",
      "TRK-", "VAN-",
    ],
  },
  operations: {
    domain: "operations",
    name: "TrafficIQ Operations Agent",
    displayName: "Operations",
    subtitle: "Work orders, scheduling & returns",
    color: "#8764B8", // purple
    iconHint: "Wrench",
    keywords: [
      "work order", "work-order", "technician", "schedule", "scheduling",
      "dispatch", "return", "returns", "rma", "refund",
      "assign", "assignment", "availability", "time slot",
      "on-site", "priority", "unscheduled",
      "approve return", "reject return", "pickup",
      "WO-", "TECH-", "RET-",
    ],
  },
  fieldservice: {
    domain: "fieldservice",
    name: "TrafficIQ Field Service Agent",
    displayName: "Field Service",
    subtitle: "Service requests, assets & SLAs",
    color: "#008575", // teal
    iconHint: "PersonWrench",
    keywords: [
      "service request", "service-request", "field service", "field-service",
      "customer asset", "customer equipment", "on-site service",
      "sla", "service agreement", "service level", "service contract",
      "dispatch technician", "dispatch", "first fix", "first-fix",
      "service visit", "complete service", "close service",
      "field parts", "field inventory", "spare parts",
      "warranty", "warranty status", "expired warranty",
      "asset health", "health score", "customer site",
      "hvac", "conveyor", "forklift", "loading dock",
      "calibration", "inspection", "repair request",
      "SR-", "SLA-", "ASSET-",
    ],
  },
  iotlogistics: {
    domain: "iotlogistics",
    name: "TrafficIQ IoT & Logistics Agent",
    displayName: "IoT & Logistics",
    subtitle: "IoT devices, geofences & route optimization",
    color: "#0E566C", // dark teal
    iconHint: "LocationRipple",
    keywords: [
      "iot", "iot device", "iot devices", "gps tracker", "gps device",
      "tracker", "trackers", "device status", "device health",
      "signal strength", "battery level", "heartbeat", "firmware",
      "geofence", "geofencing", "geo-fence", "geo fence",
      "warehouse zone", "entry alert", "exit alert", "dwell time",
      "driving behavior", "driving behaviour", "driver safety",
      "speeding", "harsh braking", "excessive idling", "route deviation",
      "connectivity", "device offline", "signal lost", "signal degraded",
      "batch route", "batch delivery", "batch optimization",
      "route alternatives", "route options", "route comparison",
      "delivery plan", "optimize shipments", "plan deliveries",
      "iot overview", "iot dashboard", "iot logistics",
      "truck vs car", "poi along route", "gas station", "rest stop",
      "IOT-GPS-", "GEO-DK", "DBA-", "CON-",
    ],
  },
};

/** All domain values (excluding orchestrator) for iteration */
export const SPECIALIST_DOMAINS = Object.keys(AGENT_CONFIGS) as Exclude<AgentDomain, "orchestrator">[];

/** Follow-up / continuation patterns for sticky routing */
export const STICKY_PATTERNS = [
  /^(yes|no|ok|sure|yep|nope|yeah|nah|correct|right|exactly)\.?\s*$/i,
  /^(show more|more details|tell me more|go ahead|continue|proceed)\.?\s*$/i,
  /^(what about|how about|and also|also check|can you also)[\s.?]/i,
  /^(thanks|thank you|great|perfect|got it)/i,
];

/** Form submission patterns (from Adaptive Card responses) */
export const FORM_SUBMISSION_PATTERNS = [
  /^(origin|destination|action|name|from|to):/i,
];

/** Maximum words for sticky routing (short follow-ups) */
export const STICKY_MAX_WORDS = 3;
