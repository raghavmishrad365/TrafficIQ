import type { OpenAIToolDefinition } from "../../agentTools";
import { d365McpClient } from "../../d365McpClient";
import { iotHubClient } from "../../iotHubClient";
import { env } from "../../../config/env";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback } from "./sharedTools";

// --- Tool definitions ---

const iotLogisticsOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "analyze_shipment_batch",
      description: "Analyze ALL pending/packed shipments, group by region and priority, and suggest 2-3 optimized multi-stop delivery plans with cost/time/distance tradeoffs for each regional cluster.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: { type: "string", description: "Optional warehouse ID to filter (e.g. 'DK01')" },
          include_statuses: { type: "string", description: "Comma-separated statuses to include (default: 'pending,packed')" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipment_route_alternatives",
      description: "For a single shipment, calculate 3 route alternatives: fastest (highway), cheapest (avoid tolls), and balanced (eco). Returns side-by-side comparison.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string", description: "The shipment ID (e.g. 'SH-2026-001')" },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_iot_device_status",
      description: "Get IoT GPS device status for fleet vehicles. Shows device health, signal strength, battery level, last heartbeat, and connectivity status.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "Optional vehicle ID to filter (e.g. 'TRK-101')" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_geofence_alerts",
      description: "Get geofence entry/exit alerts for warehouse zones. Shows which trucks entered or left defined geographic boundaries with timestamps and dwell times.",
      parameters: {
        type: "object",
        properties: {
          geofence_id: { type: "string", description: "Optional geofence ID to filter (e.g. 'GEO-DK01')" },
          vehicle_id: { type: "string", description: "Optional vehicle ID to filter" },
          event_type: { type: "string", enum: ["entry", "exit"], description: "Filter by entry or exit events" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_driving_behavior_alerts",
      description: "Get driving behavior alerts from IoT sensors: speeding, harsh braking, excessive idling, and route deviation events with severity levels.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "Optional vehicle ID to filter" },
          alert_type: { type: "string", enum: ["speeding", "harsh_braking", "excessive_idling", "route_deviation"], description: "Filter by alert type" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_connectivity_alerts",
      description: "Get IoT device connectivity alerts: GPS signal lost, device offline >5min, battery low, signal degraded. Shows ongoing and recently resolved issues.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "Optional vehicle ID to filter" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Filter by severity" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_iot_logistics_overview",
      description: "Get a combined IoT and logistics dashboard: device health summary, active geofence events, recent driving alerts, and connectivity status across the entire fleet.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const iotLogisticsToolDefinitions: OpenAIToolDefinition[] = [
  ...iotLogisticsOnlyTools,
  ...sharedToolDefinitions,
];

// --- Helper: Haversine distance in km ---

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Helper: Azure Maps route call ---

async function getAzureMapsRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options: { routeType?: string; avoid?: string } = {}
): Promise<{ distanceKm: number; durationMinutes: number; trafficDelayMinutes: number } | null> {
  const mapsKey = env.azureMapsKey;
  if (!mapsKey) return null;
  try {
    const routeType = options.routeType || "fastest";
    const avoidParam = options.avoid ? `&avoid=${options.avoid}` : "";
    const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${mapsKey}&query=${origin.lat},${origin.lng}:${destination.lat},${destination.lng}&routeType=${routeType}${avoidParam}&traffic=true&travelMode=truck`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { routes?: Array<{ summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number } }> };
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      distanceKm: Math.round(route.summary.lengthInMeters / 1000 * 10) / 10,
      durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
      trafficDelayMinutes: Math.round(route.summary.trafficDelayInSeconds / 60),
    };
  } catch {
    return null;
  }
}

// --- Tool handlers ---

async function handleAnalyzeShipmentBatch(args: { warehouse_id?: string; include_statuses?: string }): Promise<unknown> {
  const statusFilter = (args.include_statuses || "pending,packed").split(",").map(s => s.trim());
  const shipments = await d365McpClient.getWarehouseShipments(args.warehouse_id);
  const filtered = shipments.filter(s => statusFilter.includes(s.status));

  if (filtered.length === 0) {
    return { clusters: [], totalShipmentsAnalyzed: 0, totalClusters: 0, message: "No shipments matching the specified statuses.", dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
  }

  // Group by region based on destination coordinates
  const clusters: Record<string, typeof filtered> = { "Sj\u00E6lland": [], "Fyn": [], "Jylland": [] };
  for (const s of filtered) {
    const lat = s.destination.coordinates.lat;
    const lng = s.destination.coordinates.lng;
    if (lat > 55.2 && lng > 11.5) clusters["Sj\u00E6lland"].push(s);
    else if (lat >= 55.0 && lat <= 55.6 && lng >= 9.5 && lng <= 11.0) clusters["Fyn"].push(s);
    else clusters["Jylland"].push(s);
  }

  const warehouses = await d365McpClient.getWarehouses();
  const defaultWarehouse = warehouses[0];

  const result = [];
  for (const [region, regionShipments] of Object.entries(clusters)) {
    if (regionShipments.length === 0) continue;

    const totalWeight = regionShipments.reduce((sum, s) => sum + (s.totalWeight || 0), 0);
    const origin = defaultWarehouse ? { lat: defaultWarehouse.location.coordinates.lat, lng: defaultWarehouse.location.coordinates.lng } : { lat: 55.676, lng: 12.568 };
    // Use first shipment destination as representative for route estimate
    const dest = { lat: regionShipments[0].destination.coordinates.lat, lng: regionShipments[0].destination.coordinates.lng };

    const plans = [];
    const planConfigs = [
      { label: "Fastest (Highway)", routeType: "fastest", tollEstimate: 150 },
      { label: "Cheapest (Avoid Tolls)", routeType: "shortest", avoid: "tollRoads", tollEstimate: 0 },
      { label: "Balanced (Eco)", routeType: "eco", tollEstimate: 75 },
    ];

    for (const config of planConfigs) {
      const route = await getAzureMapsRoute(origin, dest, { routeType: config.routeType, avoid: (config as { avoid?: string }).avoid });
      const distanceKm = route?.distanceKm || Math.round(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng) * 1.3);
      const durationMinutes = route?.durationMinutes || Math.round(distanceKm / 75 * 60);
      const trafficDelay = route?.trafficDelayMinutes || Math.round(Math.random() * 15);

      plans.push({
        planLabel: config.label,
        stopOrder: regionShipments.map((s, i) => ({ stopNumber: i + 1, shipmentId: s.shipmentId, destination: s.destination.label, customerName: s.customerName })),
        totalDistanceKm: distanceKm,
        totalDurationMinutes: durationMinutes,
        estimatedFuelCostDKK: Math.round(distanceKm * 4.85),
        estimatedTollCostDKK: config.tollEstimate,
        estimatedCO2Kg: Math.round(distanceKm * 0.27 * 10) / 10,
        trafficDelayMinutes: trafficDelay,
      });
    }

    const hasUrgent = regionShipments.some(s => s.priority === "urgent" || s.priority === "express");
    const recommended = hasUrgent ? "Fastest (Highway)" : "Balanced (Eco)";

    result.push({
      region,
      shipmentCount: regionShipments.length,
      totalWeightKg: totalWeight,
      shipmentIds: regionShipments.map(s => s.shipmentId),
      plans,
      recommendedPlan: recommended,
    });
  }

  return {
    clusters: result,
    totalShipmentsAnalyzed: filtered.length,
    totalClusters: result.length,
    analysisTimestamp: new Date().toISOString(),
    dataSource: d365McpClient.isConnected() ? "D365 F&O + Azure Maps" : "Demo Data + Azure Maps",
  };
}

async function handleGetShipmentRouteAlternatives(args: { shipment_id: string }): Promise<unknown> {
  const shipment = await d365McpClient.checkShipmentStatus(args.shipment_id);
  if (!shipment) return { error: `Shipment not found: ${args.shipment_id}` };

  const origin = { lat: shipment.origin.coordinates.lat, lng: shipment.origin.coordinates.lng };
  const dest = { lat: shipment.destination.coordinates.lat, lng: shipment.destination.coordinates.lng };

  const routeConfigs = [
    { label: "Fastest (Highway)", routeType: "fastest", tollEstimate: 150, usesHighway: true, usesTolls: true },
    { label: "Cheapest (Avoid Tolls)", routeType: "shortest", avoid: "tollRoads", tollEstimate: 0, usesHighway: false, usesTolls: false },
    { label: "Balanced (Eco)", routeType: "eco", tollEstimate: 75, usesHighway: true, usesTolls: true },
  ];

  const routes = [];
  for (const config of routeConfigs) {
    const route = await getAzureMapsRoute(origin, dest, { routeType: config.routeType, avoid: (config as { avoid?: string }).avoid });
    const distanceKm = route?.distanceKm || Math.round(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng) * (config.usesHighway ? 1.3 : 1.5));
    const durationMinutes = route?.durationMinutes || Math.round(distanceKm / (config.usesHighway ? 80 : 65) * 60);
    const trafficDelay = route?.trafficDelayMinutes || Math.round(Math.random() * 15);

    routes.push({
      label: config.label,
      distanceKm,
      durationMinutes,
      trafficDelayMinutes: trafficDelay,
      estimatedFuelCostDKK: Math.round(distanceKm * 4.85),
      estimatedTollCostDKK: config.tollEstimate,
      estimatedCO2Kg: Math.round(distanceKm * 0.27 * 10) / 10,
      usesHighway: config.usesHighway,
      usesTolls: config.usesTolls,
    });
  }

  const recommendation = shipment.priority === "urgent" || shipment.priority === "express"
    ? "Fastest (Highway) \u2014 urgent shipment needs quickest delivery"
    : "Balanced (Eco) \u2014 standard priority, optimizes cost and time";

  return {
    shipmentId: shipment.shipmentId,
    origin: shipment.origin.label,
    destination: shipment.destination.label,
    customerName: shipment.customerName,
    priority: shipment.priority,
    routes,
    recommendation,
    dataSource: d365McpClient.isConnected() ? "D365 F&O + Azure Maps" : "Demo Data + Azure Maps",
  };
}

function signalStatus(pct: number): string {
  if (pct >= 75) return "good";
  if (pct >= 50) return "fair";
  if (pct > 0) return "poor";
  return "none";
}

function batteryStatus(pct: number): string {
  if (pct >= 30) return "good";
  if (pct >= 15) return "low";
  return "critical";
}

async function handleGetIoTDeviceStatus(args: { vehicle_id?: string }): Promise<unknown> {
  const devices = await iotHubClient.getDevices(args.vehicle_id);

  const now = Date.now();
  return {
    devices: devices.map(d => ({
      deviceId: d.deviceId,
      vehicleId: d.vehicleId,
      licensePlate: d.licensePlate,
      status: d.status,
      signalStrengthPercent: d.signalStrengthPercent,
      signalStatus: signalStatus(d.signalStrengthPercent),
      batteryLevelPercent: d.batteryLevelPercent,
      batteryStatus: batteryStatus(d.batteryLevelPercent),
      lastHeartbeat: d.lastHeartbeat,
      minutesSinceHeartbeat: Math.round((now - new Date(d.lastHeartbeat).getTime()) / 60000),
      lastKnownLocation: d.lastKnownLocation.label,
      deviceModel: d.deviceModel,
      firmwareVersion: d.firmwareVersion,
    })),
    summary: {
      total: devices.length,
      online: devices.filter(d => d.status === "online").length,
      offline: devices.filter(d => d.status === "offline").length,
      degraded: devices.filter(d => d.status === "degraded").length,
      lowBattery: devices.filter(d => d.batteryLevelPercent < 30).length,
    },
    dataSource: iotHubClient.isConnected() ? "Azure IoT Hub" : "IoT Hub (Demo)",
  };
}

async function handleGetGeofenceAlerts(args: { geofence_id?: string; vehicle_id?: string; event_type?: string }): Promise<unknown> {
  const [geofences, alerts] = await Promise.all([
    iotHubClient.getGeofences(),
    iotHubClient.getGeofenceAlerts({ geofenceId: args.geofence_id, vehicleId: args.vehicle_id, eventType: args.event_type }),
  ]);

  return {
    geofences: geofences.map(g => ({ geofenceId: g.geofenceId, name: g.name, warehouseId: g.warehouseId, radiusMeters: g.radiusMeters })),
    alerts,
    totalAlerts: alerts.length,
    unexpectedEntries: alerts.filter(a => !a.expectedEntry).length,
    dataSource: iotHubClient.isConnected() ? "Azure IoT Hub" : "IoT Geofencing (Demo)",
  };
}

async function handleGetDrivingBehaviorAlerts(args: { vehicle_id?: string; alert_type?: string }): Promise<unknown> {
  // Get filtered alerts and all alerts (for safety score calculation)
  const [alerts, allAlerts] = await Promise.all([
    iotHubClient.getDrivingAlerts({ vehicleId: args.vehicle_id, alertType: args.alert_type }),
    iotHubClient.getDrivingAlerts(),
  ]);

  // Calculate per-vehicle safety scores from all alerts
  const vehicleMap = new Map<string, { driverName: string; count: number; criticals: number }>();
  for (const a of allAlerts) {
    const entry = vehicleMap.get(a.vehicleId) || { driverName: a.driverName, count: 0, criticals: 0 };
    entry.count++;
    if (a.severity === "critical" || a.severity === "high") entry.criticals++;
    vehicleMap.set(a.vehicleId, entry);
  }

  const vehicleScores = Array.from(vehicleMap.entries()).map(([vehicleId, data]) => ({
    vehicleId,
    driverName: data.driverName,
    safetyScore: Math.max(0, 100 - data.count * 12 - data.criticals * 15),
    alertCount: data.count,
  }));

  return {
    alerts: alerts.map(a => ({
      id: a.id, vehicleId: a.vehicleId, driverName: a.driverName,
      alertType: a.alertType, severity: a.severity, timestamp: a.timestamp,
      location: a.location.label, details: a.details,
      ...(a.speedKmh !== undefined ? { speedKmh: a.speedKmh, speedLimitKmh: a.speedLimitKmh } : {}),
      ...(a.durationSeconds !== undefined ? { durationSeconds: a.durationSeconds } : {}),
    })),
    summary: {
      totalAlerts: alerts.length,
      speeding: alerts.filter(a => a.alertType === "speeding").length,
      harshBraking: alerts.filter(a => a.alertType === "harsh_braking").length,
      excessiveIdling: alerts.filter(a => a.alertType === "excessive_idling").length,
      routeDeviation: alerts.filter(a => a.alertType === "route_deviation").length,
      criticalCount: alerts.filter(a => a.severity === "critical" || a.severity === "high").length,
    },
    vehicleScores,
    dataSource: iotHubClient.isConnected() ? "Azure IoT Hub" : "IoT Telematics (Demo)",
  };
}

async function handleGetConnectivityAlerts(args: { vehicle_id?: string; severity?: string }): Promise<unknown> {
  const alerts = await iotHubClient.getConnectivityAlerts({ vehicleId: args.vehicle_id, severity: args.severity });

  return {
    alerts: alerts.map(a => ({
      id: a.id, deviceId: a.deviceId, vehicleId: a.vehicleId,
      alertType: a.alertType, severity: a.severity, timestamp: a.timestamp,
      resolvedAt: a.resolvedAt, isOngoing: a.resolvedAt === null,
      durationMinutes: a.durationMinutes, details: a.details,
    })),
    summary: {
      totalAlerts: alerts.length,
      ongoing: alerts.filter(a => a.resolvedAt === null).length,
      resolved: alerts.filter(a => a.resolvedAt !== null).length,
      criticalCount: alerts.filter(a => a.severity === "critical").length,
    },
    dataSource: iotHubClient.isConnected() ? "Azure IoT Hub" : "IoT Hub (Demo)",
  };
}

async function handleGetIoTLogisticsOverview(): Promise<unknown> {
  const [devices, geofences, geofenceAlerts, drivingAlerts, connectivityAlerts] = await Promise.all([
    iotHubClient.getDevices(),
    iotHubClient.getGeofences(),
    iotHubClient.getGeofenceAlerts(),
    iotHubClient.getDrivingAlerts(),
    iotHubClient.getConnectivityAlerts(),
  ]);

  const ongoingConnectivity = connectivityAlerts.filter(a => a.resolvedAt === null);
  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + d.batteryLevelPercent, 0) / devices.length)
    : 0;

  return {
    deviceHealth: {
      total: devices.length,
      online: devices.filter(d => d.status === "online").length,
      offline: devices.filter(d => d.status === "offline").length,
      degraded: devices.filter(d => d.status === "degraded").length,
      avgBatteryPercent: avgBattery,
    },
    geofencing: {
      activeGeofences: geofences.length,
      recentEvents24h: geofenceAlerts.length,
      unexpectedEntries: geofenceAlerts.filter(a => !a.expectedEntry).length,
    },
    drivingBehavior: {
      totalAlerts24h: drivingAlerts.length,
      criticalAlerts: drivingAlerts.filter(a => a.severity === "critical" || a.severity === "high").length,
      fleetSafetyScore: Math.round(devices.length > 0 ? 100 - drivingAlerts.length * 5 : 100),
    },
    connectivity: {
      ongoingIssues: ongoingConnectivity.length,
      resolvedToday: connectivityAlerts.filter(a => a.resolvedAt !== null).length,
    },
    lastUpdated: new Date().toISOString(),
    dataSource: iotHubClient.isConnected() ? "Azure IoT Hub" : "IoT Hub (Demo)",
  };
}

// --- Unified tool executor ---

export async function executeIoTLogisticsTool(name: string, argsJson: string): Promise<string> {
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;

  switch (name) {
    case "analyze_shipment_batch":
      result = await handleAnalyzeShipmentBatch(args);
      break;
    case "get_shipment_route_alternatives":
      result = await handleGetShipmentRouteAlternatives(args);
      break;
    case "get_iot_device_status":
      result = await handleGetIoTDeviceStatus(args);
      break;
    case "get_geofence_alerts":
      result = await handleGetGeofenceAlerts(args);
      break;
    case "get_driving_behavior_alerts":
      result = await handleGetDrivingBehaviorAlerts(args);
      break;
    case "get_connectivity_alerts":
      result = await handleGetConnectivityAlerts(args);
      break;
    case "get_iot_logistics_overview":
      result = await handleGetIoTLogisticsOverview();
      break;
    default:
      result = { error: `Unknown IoT logistics tool: ${name}` };
  }

  // Auto-navigate to the relevant page
  const TOOL_PAGE_MAP: Record<string, string> = {
    get_iot_device_status: "/iot-devices",
    get_geofence_alerts: "/iot-devices",
    get_driving_behavior_alerts: "/iot-devices",
    get_connectivity_alerts: "/iot-devices",
    get_iot_logistics_overview: "/iot-devices",
    analyze_shipment_batch: "/shipments",
    get_shipment_route_alternatives: "/tracking",
  };
  const targetPage = TOOL_PAGE_MAP[name];
  if (targetPage) {
    const nav = getNavigateCallback();
    if (nav) nav(targetPage);
  }

  return JSON.stringify(result);
}
