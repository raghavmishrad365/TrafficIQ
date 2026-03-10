import type { OpenAIToolDefinition } from "../../agentTools";
import { d365McpClient } from "../../d365McpClient";
import { env } from "../../../config/env";
import { computeCorridorBounds, fetchCorridorIncidents, classifyStatus } from "../../../hooks/useJourneyMonitor";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback } from "./sharedTools";

// --- Tool Definitions ---

const supplyChainOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_warehouse_shipments",
      description: "Get shipments from D365 Warehouse Management. Returns pending, active, and in-transit shipments with traffic status.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: { type: "string", description: "Warehouse ID to filter by (e.g. 'DK01')" },
          status: { type: "string", enum: ["pending", "picked", "packed", "in_transit", "delivered", "delayed", "cancelled"], description: "Filter by shipment status" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_delivery_schedule",
      description: "Get scheduled deliveries for a date range from D365.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
          end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
          warehouse_id: { type: "string", description: "Optional warehouse ID to filter by" },
        },
        required: ["start_date", "end_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_delivery_route",
      description: "Plan an optimized multi-stop delivery route for multiple shipments using Azure Maps.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: { type: "string", description: "Origin warehouse ID" },
          shipment_ids: { type: "array", items: { type: "string" }, description: "Array of shipment IDs to include" },
        },
        required: ["warehouse_id", "shipment_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_shipment_status",
      description: "Check the real-time status of a specific shipment including current traffic conditions.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string", description: "The shipment ID to check" },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_shipment_eta",
      description: "Update the ETA for a shipment in D365 based on current traffic conditions.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string", description: "The shipment ID to update" },
          new_eta: { type: "string", description: "New ETA in ISO 8601 format" },
        },
        required: ["shipment_id", "new_eta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_warehouse_inventory",
      description: "Check inventory levels at a specific D365 warehouse.",
      parameters: {
        type: "object",
        properties: {
          warehouse_id: { type: "string", description: "The warehouse ID to check inventory for" },
        },
        required: ["warehouse_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_alerts",
      description: "Get items below their reorder point across all warehouses.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_supply_chain_kpis",
      description: "Get aggregated supply chain KPIs including on-time delivery rate, fleet utilization, etc.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exception_alerts",
      description: "Get active exception alerts across the supply chain.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "track_shipment",
      description: "Get full shipment tracking detail including timeline of events and current location.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string", description: "The shipment ID to track" },
        },
        required: ["shipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_proof_of_delivery",
      description: "Get proof of delivery for a completed shipment.",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string", description: "The shipment ID to check" },
        },
        required: ["shipment_id"],
      },
    },
  },
];

export const supplyChainToolDefinitions: OpenAIToolDefinition[] = [
  ...supplyChainOnlyTools,
  ...sharedToolDefinitions,
];

// --- Tool Handlers ---

async function handleGetWarehouseShipments(args: { warehouse_id?: string; status?: string }): Promise<unknown> {
  const shipments = await d365McpClient.getWarehouseShipments(args.warehouse_id, args.status);
  return { shipments: shipments.map(s => ({ shipmentId: s.shipmentId, warehouseId: s.warehouseId, warehouseName: s.warehouseName, origin: s.origin.label, destination: s.destination.label, customerName: s.customerName, status: s.status, scheduledDate: s.scheduledDate, estimatedArrival: s.estimatedArrival, totalWeight: s.totalWeight, itemCount: s.items.length, currentTrafficDelay: s.currentTrafficDelay, routeDistanceKm: s.routeDistanceKm, routeDurationMinutes: s.routeDurationMinutes, priority: s.priority })), totalCount: shipments.length, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
}

async function handleGetDeliverySchedule(args: { start_date: string; end_date: string; warehouse_id?: string }): Promise<unknown> {
  const shipments = await d365McpClient.getDeliverySchedule(args.start_date, args.end_date, args.warehouse_id);
  return { schedule: shipments.map(s => ({ shipmentId: s.shipmentId, warehouseId: s.warehouseId, destination: s.destination.label, customerName: s.customerName, scheduledDate: s.scheduledDate, status: s.status, priority: s.priority })), dateRange: { start: args.start_date, end: args.end_date }, totalCount: shipments.length };
}

async function handleOptimizeDeliveryRoute(args: { warehouse_id: string; shipment_ids: string[] }): Promise<unknown> {
  const allShipments = await d365McpClient.getWarehouseShipments(args.warehouse_id);
  const selectedShipments = allShipments.filter(s => args.shipment_ids.includes(s.shipmentId) || args.shipment_ids.includes(s.id));
  if (selectedShipments.length === 0) return { error: "No matching shipments found for the given IDs" };
  const warehouses = await d365McpClient.getWarehouses();
  const warehouse = warehouses.find(w => w.id === args.warehouse_id);
  if (!warehouse) return { error: `Warehouse ${args.warehouse_id} not found` };
  const key = env.azureMapsKey;
  const origin = warehouse.location.coordinates;
  const waypoints = selectedShipments.map(s => `${s.destination.coordinates.lat},${s.destination.coordinates.lng}`);
  const query = `${origin.lat},${origin.lng}:${waypoints.join(":")}`;
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${query}&travelMode=car&traffic=true&routeType=fastest&computeBestOrder=true&instructionsType=text`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Azure Maps route optimization failed: ${res.statusText}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return { error: "No optimized route found" };
  const optimizedOrder: number[] = route.optimizedWaypoints?.map((wp: { providedIndex: number; optimizedIndex: number }) => wp.optimizedIndex) || selectedShipments.map((_, i) => i);
  const totalDistance = Math.round((route.summary.lengthInMeters / 1000) * 10) / 10;
  const totalDuration = Math.round(route.summary.travelTimeInSeconds / 60);
  const trafficDelay = Math.round(route.summary.trafficDelayInSeconds / 60);
  const orderedStops = optimizedOrder.map((originalIdx: number, order: number) => { const shipment = selectedShipments[originalIdx] || selectedShipments[order]; return { stopOrder: order + 1, shipmentId: shipment?.shipmentId || `Unknown-${order}`, destination: shipment?.destination.label || "Unknown", customerName: shipment?.customerName || "Unknown" }; });
  const navigateCallback = getNavigateCallback();
  if (navigateCallback) navigateCallback("/delivery-planner");
  return { origin: warehouse.name, stops: orderedStops, totalStops: selectedShipments.length, totalDistanceKm: totalDistance, totalDurationMinutes: totalDuration + trafficDelay, trafficDelayMinutes: trafficDelay, optimizationApplied: true, dataSource: d365McpClient.isConnected() ? "D365 F&O + Azure Maps" : "Demo Data + Azure Maps" };
}

async function handleCheckShipmentStatus(args: { shipment_id: string }): Promise<unknown> {
  const shipment = await d365McpClient.checkShipmentStatus(args.shipment_id);
  if (!shipment) return { error: `Shipment not found: ${args.shipment_id}` };
  const bounds = computeCorridorBounds(shipment.origin.coordinates.lat, shipment.origin.coordinates.lng, shipment.destination.coordinates.lat, shipment.destination.coordinates.lng);
  const incidents = await fetchCorridorIncidents(bounds);
  const trafficStatus = classifyStatus(incidents);
  return { shipment: { shipmentId: shipment.shipmentId, status: shipment.status, origin: shipment.origin.label, destination: shipment.destination.label, customerName: shipment.customerName, scheduledDate: shipment.scheduledDate, estimatedArrival: shipment.estimatedArrival, priority: shipment.priority, totalWeight: shipment.totalWeight, items: shipment.items.map(i => ({ name: i.itemName, quantity: i.quantity, unit: i.unit })) }, trafficStatus, incidentCount: incidents.length, incidents: incidents.slice(0, 5).map(i => ({ title: i.title, severity: i.severity, type: i.type, delayMinutes: i.delayMinutes })), currentTrafficDelay: shipment.currentTrafficDelay, lastChecked: new Date().toISOString() };
}

async function handleUpdateShipmentEta(args: { shipment_id: string; new_eta: string }): Promise<unknown> {
  const success = await d365McpClient.updateShipmentEta(args.shipment_id, args.new_eta);
  return { success, shipmentId: args.shipment_id, newEta: args.new_eta, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data", message: success ? `ETA updated to ${args.new_eta} for shipment ${args.shipment_id}` : `Failed to update ETA for shipment ${args.shipment_id}` };
}

async function handleGetWarehouseInventory(args: { warehouse_id: string }): Promise<unknown> {
  const inventory = await d365McpClient.getWarehouseInventory(args.warehouse_id);
  const warehouses = await d365McpClient.getWarehouses();
  const warehouse = warehouses.find(w => w.id === args.warehouse_id);
  return { warehouseId: args.warehouse_id, warehouseName: warehouse?.name || args.warehouse_id, items: inventory.map(i => ({ itemId: i.itemId, itemName: i.itemName, onHand: i.quantityOnHand, reserved: i.quantityReserved, available: i.quantityAvailable, unit: i.unit, belowReorderPoint: i.reorderPoint ? i.quantityAvailable < i.reorderPoint : false })), totalItems: inventory.length, itemsBelowReorder: inventory.filter(i => i.reorderPoint && i.quantityAvailable < i.reorderPoint).length, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
}

async function handleGetInventoryAlerts(): Promise<unknown> {
  const alerts = await d365McpClient.getInventoryAlerts();
  const warehouses = await d365McpClient.getWarehouses();
  return { alerts: alerts.map(i => { const wh = warehouses.find(w => w.id === i.warehouseId); return { itemId: i.itemId, itemName: i.itemName, warehouseId: i.warehouseId, warehouseName: wh?.name || i.warehouseId, available: i.quantityAvailable, reorderPoint: i.reorderPoint, deficit: (i.reorderPoint || 0) - i.quantityAvailable, unit: i.unit }; }), totalAlerts: alerts.length, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
}

async function handleGetSupplyChainKPIs(): Promise<unknown> {
  const kpis = await d365McpClient.getSupplyChainKPIs();
  return { kpis, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data", generatedAt: new Date().toISOString() };
}

async function handleGetExceptionAlerts(): Promise<unknown> {
  const alerts = await d365McpClient.getExceptionAlerts();
  return { alerts: alerts.map(a => ({ id: a.id, type: a.type, severity: a.severity, title: a.title, description: a.description, relatedEntityId: a.relatedEntityId, timestamp: a.timestamp })), totalAlerts: alerts.length, criticalCount: alerts.filter(a => a.severity === "critical").length, highCount: alerts.filter(a => a.severity === "high").length, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
}

async function handleTrackShipment(args: { shipment_id: string }): Promise<unknown> {
  const tracking = await d365McpClient.getShipmentTracking(args.shipment_id);
  if (!tracking) return { error: `No tracking data found for shipment: ${args.shipment_id}` };
  const shipment = await d365McpClient.checkShipmentStatus(args.shipment_id);
  return { shipmentId: tracking.shipmentId, status: shipment?.status || "unknown", origin: shipment?.origin.label, destination: shipment?.destination.label, customerName: shipment?.customerName, events: tracking.events, currentLocation: tracking.currentLocation?.label || null, estimatedDelivery: tracking.estimatedDelivery, hasProofOfDelivery: !!tracking.proofOfDelivery, dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data" };
}

async function handleGetProofOfDelivery(args: { shipment_id: string }): Promise<unknown> {
  const tracking = await d365McpClient.getShipmentTracking(args.shipment_id);
  if (!tracking) return { error: `No tracking data found for shipment: ${args.shipment_id}` };
  if (!tracking.proofOfDelivery) return { shipmentId: args.shipment_id, delivered: false, message: "Shipment has not been delivered yet." };
  return { shipmentId: args.shipment_id, delivered: true, proofOfDelivery: { signatureCollected: tracking.proofOfDelivery.signature, photoTaken: tracking.proofOfDelivery.photo, deliveryTimestamp: tracking.proofOfDelivery.timestamp } };
}

// --- Unified tool executor ---

// --- Auto-navigation: map tool names to the page they should open ---
const TOOL_PAGE_MAP: Record<string, string> = {
  get_warehouse_shipments: "/shipments",
  get_delivery_schedule: "/shipments",
  check_shipment_status: "/tracking",
  track_shipment: "/tracking",
  get_proof_of_delivery: "/tracking",
  update_shipment_eta: "/shipments",
  get_warehouse_inventory: "/inventory",
  get_inventory_alerts: "/inventory",
  get_supply_chain_kpis: "/analytics",
  get_exception_alerts: "/analytics",
  // optimize_delivery_route already navigates to /delivery-planner in its handler
};

export async function executeSupplyChainTool(name: string, argsJson: string): Promise<string> {
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;
  switch (name) {
    case "get_warehouse_shipments": result = await handleGetWarehouseShipments(args); break;
    case "get_delivery_schedule": result = await handleGetDeliverySchedule(args); break;
    case "optimize_delivery_route": result = await handleOptimizeDeliveryRoute(args); break;
    case "check_shipment_status": result = await handleCheckShipmentStatus(args); break;
    case "update_shipment_eta": result = await handleUpdateShipmentEta(args); break;
    case "get_warehouse_inventory": result = await handleGetWarehouseInventory(args); break;
    case "get_inventory_alerts": result = await handleGetInventoryAlerts(); break;
    case "get_supply_chain_kpis": result = await handleGetSupplyChainKPIs(); break;
    case "get_exception_alerts": result = await handleGetExceptionAlerts(); break;
    case "track_shipment": result = await handleTrackShipment(args); break;
    case "get_proof_of_delivery": result = await handleGetProofOfDelivery(args); break;
    default: result = { error: `Unknown supply chain tool: ${name}` };
  }
  // Auto-navigate to the relevant page
  const targetPage = TOOL_PAGE_MAP[name];
  if (targetPage) {
    const navCb = getNavigateCallback();
    if (navCb) navCb(targetPage);
  }
  return JSON.stringify(result);
}
