import type { OpenAIToolDefinition } from "../../agentTools";
import { d365McpClient } from "../../d365McpClient";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback } from "./sharedTools";
import { getRouteRange, snapToRoads } from "../../azureMapsService";

// --- Auto-navigation: map tool names to the page they should open ---
const TOOL_PAGE_MAP: Record<string, string> = {
  get_fleet_status: "/fleet",
  get_driver_performance: "/fleet",
  get_vehicle_health: "/maintenance",
  get_maintenance_alerts: "/maintenance",
  get_maintenance_history: "/maintenance",
};

// --- Tool Definitions ---

const fleetOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_fleet_status",
      description: "Get real-time fleet status with vehicle locations, drivers, loads, speeds, and operational status.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_driver_performance",
      description: "Get driver performance metrics including hours on duty, distance covered, and assignment status.",
      parameters: {
        type: "object",
        properties: {
          driver_id: { type: "string", description: "Optional driver ID to filter" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vehicle_health",
      description: "Get fleet vehicle health scores and predicted maintenance needs.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_alerts",
      description: "Get critical and upcoming maintenance alerts across the fleet.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_history",
      description: "Get past maintenance and service records. Can filter by vehicle ID.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "Optional vehicle ID to filter history" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reachable_range",
      description: "Calculate the reachable area (isochrone) from a vehicle's current location within a given time or fuel budget.",
      parameters: {
        type: "object",
        properties: {
          center_lat: { type: "number", description: "Center latitude" },
          center_lng: { type: "number", description: "Center longitude" },
          time_budget_minutes: { type: "number", description: "Time budget in minutes (default: 30)" },
          travel_mode: { type: "string", enum: ["car", "truck"], description: "Travel mode (default: truck)" },
        },
        required: ["center_lat", "center_lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "snap_fleet_positions",
      description: "Snap vehicle GPS positions to nearest roads and get road names and speed limits.",
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

export const fleetToolDefinitions: OpenAIToolDefinition[] = [
  ...fleetOnlyTools,
  ...sharedToolDefinitions,
];

// --- Tool Handlers ---

async function handleGetFleetStatus(): Promise<unknown> {
  const vehicles = await d365McpClient.getFleetStatus();
  const inTransit = vehicles.filter(v => v.status === "in_transit").length;
  const idle = vehicles.filter(v => v.status === "idle").length;
  const maintenance = vehicles.filter(v => v.status === "maintenance").length;
  return {
    vehicles: vehicles.map(v => ({
      vehicleId: v.vehicleId, licensePlate: v.licensePlate, driverName: v.driverName,
      status: v.status, location: v.currentLocation.label, assignedRoute: v.assignedRoute || "None",
      currentShipmentId: v.currentShipmentId || "None", loadPercent: v.loadPercent,
      speedKmh: v.speedKmh, fuelLevelPercent: v.fuelLevelPercent,
    })),
    summary: { total: vehicles.length, inTransit, idle, maintenance, returning: vehicles.length - inTransit - idle - maintenance },
    fleetUtilization: Math.round((inTransit / vehicles.length) * 100),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetDriverPerformance(args: { driver_id?: string }): Promise<unknown> {
  const vehicles = await d365McpClient.getFleetStatus();
  const filtered = args.driver_id ? vehicles.filter(v => v.driverId === args.driver_id) : vehicles;
  return {
    drivers: filtered.map(v => ({
      driverId: v.driverId, driverName: v.driverName, vehicleId: v.vehicleId,
      status: v.status, hoursOnDuty: v.hoursOnDuty, distanceTodayKm: v.distanceTodayKm,
      currentSpeed: v.speedKmh, fuelLevel: v.fuelLevelPercent, currentLocation: v.currentLocation.label,
    })),
    totalDrivers: filtered.length,
  };
}

async function handleGetVehicleHealth(): Promise<unknown> {
  const vehicles = await d365McpClient.getVehicleHealth();
  const critical = vehicles.filter(v => v.healthScore < 50).length;
  const warning = vehicles.filter(v => v.healthScore >= 50 && v.healthScore < 75).length;
  const healthy = vehicles.filter(v => v.healthScore >= 75).length;
  return {
    vehicles: vehicles.map(v => ({
      vehicleId: v.vehicleId, licensePlate: v.licensePlate, healthScore: v.healthScore,
      lastServiceDate: v.lastServiceDate, nextPredictedService: v.nextPredictedService,
      mileageKm: v.mileageKm, engineHours: v.engineHours, alertCount: v.alerts.length,
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
      id: a.id, vehicleId: a.vehicleId, component: a.component, severity: a.severity,
      predictedFailureDate: a.predictedFailureDate, confidencePercent: a.confidencePercent,
      recommendedAction: a.recommendedAction, estimatedCost: a.estimatedCost,
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
      id: r.id, vehicleId: r.vehicleId, serviceType: r.serviceType, date: r.date,
      cost: r.cost, technician: r.technician, notes: r.notes,
    })),
    totalRecords: records.length,
    totalCost: records.reduce((s, r) => s + r.cost, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleGetReachableRange(args: {
  center_lat: number; center_lng: number;
  time_budget_minutes?: number; travel_mode?: "car" | "truck";
}): Promise<unknown> {
  const range = await getRouteRange({
    center: { lat: args.center_lat, lng: args.center_lng },
    timeBudgetMinutes: args.time_budget_minutes || 30,
    travelMode: args.travel_mode || "truck",
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

export async function executeFleetTool(name: string, argsJson: string): Promise<string> {
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;
  switch (name) {
    case "get_fleet_status": result = await handleGetFleetStatus(); break;
    case "get_driver_performance": result = await handleGetDriverPerformance(args); break;
    case "get_vehicle_health": result = await handleGetVehicleHealth(); break;
    case "get_maintenance_alerts": result = await handleGetMaintenanceAlerts(); break;
    case "get_maintenance_history": result = await handleGetMaintenanceHistory(args); break;
    case "get_reachable_range": result = await handleGetReachableRange(args); break;
    case "snap_fleet_positions": result = await handleSnapFleetPositions(args); break;
    default: result = { error: `Unknown fleet tool: ${name}` };
  }
  // Auto-navigate to the relevant page
  const targetPage = TOOL_PAGE_MAP[name];
  if (targetPage) {
    const nav = getNavigateCallback();
    if (nav) nav(targetPage);
  }
  return JSON.stringify(result);
}
