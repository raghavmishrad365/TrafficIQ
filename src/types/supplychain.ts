import type { Location } from "./journey";

// --- Shipment Types ---

export type ShipmentStatus =
  | "pending"
  | "picked"
  | "packed"
  | "in_transit"
  | "delivered"
  | "delayed"
  | "cancelled";

export interface ShipmentItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  weight?: number;
}

export interface Shipment {
  id: string;
  shipmentId: string;
  warehouseId: string;
  warehouseName: string;
  origin: Location;
  destination: Location;
  customerName: string;
  status: ShipmentStatus;
  scheduledDate: string;
  estimatedArrival?: string;
  actualDeparture?: string;
  items: ShipmentItem[];
  totalWeight?: number;
  currentTrafficDelay?: number;
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  priority: "standard" | "express" | "urgent";
  d365ExternalId?: string;
}

// --- Warehouse Types ---

export interface Warehouse {
  id: string;
  name: string;
  location: Location;
  activeShipments: number;
  pendingShipments: number;
  totalInventoryItems: number;
  d365ExternalId?: string;
}

export interface InventoryItem {
  itemId: string;
  itemName: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  unit: string;
  reorderPoint?: number;
  lastUpdated: string;
  d365ExternalId?: string;
}

// --- Delivery Route Types ---

export interface DeliveryStop {
  shipmentId: string;
  location: Location;
  customerName: string;
  timeWindow?: {
    start: string;
    end: string;
  };
  estimatedArrival?: string;
  stopOrder: number;
}

export interface DeliveryRoute {
  id: string;
  warehouseId: string;
  warehouseName: string;
  origin: Location;
  stops: DeliveryStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  trafficDelayMinutes: number;
  optimizedOrder: number[];
  coordinates: [number, number][];
  createdAt: string;
}

// --- Fleet / Vehicle Types ---

export type FleetVehicleStatus = "in_transit" | "idle" | "maintenance" | "returning";

export interface FleetVehicle {
  id: string;
  vehicleId: string;
  licensePlate: string;
  driverName: string;
  driverId: string;
  status: FleetVehicleStatus;
  currentLocation: Location;
  assignedRoute?: string;
  currentShipmentId?: string;
  loadPercent: number;
  speedKmh: number;
  fuelLevelPercent: number;
  hoursOnDuty: number;
  distanceTodayKm: number;
  d365ExternalId?: string;
}

// --- Work Order / Field Service Types ---

export type WorkOrderStatus = "unscheduled" | "scheduled" | "in_progress" | "completed" | "cancelled";

export interface WorkOrder {
  id: string;
  workOrderId: string;
  customerName: string;
  serviceType: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  status: WorkOrderStatus;
  location: Location;
  estimatedDuration: number;
  scheduledDate?: string;
  assignedTechnicianId?: string;
  description: string;
  createdDate: string;
  d365ExternalId?: string;
}

export type TechnicianStatus = "available" | "on_job" | "off_duty";

export interface Technician {
  id: string;
  name: string;
  skills: string[];
  status: TechnicianStatus;
  currentLocation: Location;
  todayWorkOrders: number;
  completedToday: number;
  phone: string;
  d365ExternalId?: string;
}

// --- Analytics / KPI Types ---

export interface SupplyChainKPIs {
  onTimeDeliveryRate: number;
  avgDeliveryTimeMinutes: number;
  activeShipments: number;
  delayedShipments: number;
  costPerKm: number;
  slaComplianceRate: number;
  warehouseUtilization: number;
  fleetUtilization: number;
  totalDeliveriesToday: number;
  pendingWorkOrders: number;
  d365ExternalId?: string;
}

export interface ExceptionAlert {
  id: string;
  type: "delay" | "stock" | "sla" | "maintenance" | "weather";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  relatedEntityId?: string;
  timestamp: string;
}

// --- Traffic Impact Types ---

export interface ShipmentTrafficImpact {
  shipmentId: string;
  shipmentName: string;
  incidentCount: number;
  totalDelayMinutes: number;
  severity: "none" | "minor" | "moderate" | "severe";
  affectedSegments: string[];
}

export interface TrafficImpactSummary {
  totalShipments: number;
  affectedShipments: number;
  totalDelayMinutes: number;
  impacts: ShipmentTrafficImpact[];
  generatedAt: string;
}

// --- Resource Scheduling Types ---

export interface ScheduleSlot {
  workOrderId: string;
  technicianId: string;
  startHour: number;
  durationHours: number;
  priority: WorkOrder["priority"];
  customerName: string;
  serviceType: string;
}

// --- Shipment Tracking Types ---

export interface TrackingEvent {
  status: string;
  timestamp: string;
  location: string;
  description: string;
}

export interface ShipmentTracking {
  shipmentId: string;
  events: TrackingEvent[];
  currentLocation?: Location;
  estimatedDelivery: string;
  proofOfDelivery?: { signature: boolean; photo: boolean; timestamp: string };
}

// --- Predictive Maintenance Types ---

export type MaintenanceComponent = "brakes" | "oil" | "tires" | "battery" | "transmission" | "coolant" | "filters";

export interface VehicleHealth {
  vehicleId: string;
  licensePlate: string;
  healthScore: number;
  lastServiceDate: string;
  nextPredictedService: string;
  mileageKm: number;
  engineHours: number;
  alerts: MaintenanceAlert[];
  d365ExternalId?: string;
}

export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  component: MaintenanceComponent;
  severity: "low" | "medium" | "high" | "critical";
  predictedFailureDate: string;
  confidencePercent: number;
  recommendedAction: string;
  estimatedCost: number;
  d365ExternalId?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  date: string;
  cost: number;
  technician: string;
  notes: string;
  d365ExternalId?: string;
}

// --- Returns & Reverse Logistics Types ---

export type ReturnStatus = "requested" | "approved" | "pickup_scheduled" | "in_transit" | "received" | "processed" | "rejected";
export type ReturnReason = "damaged" | "wrong_item" | "quality_issue" | "changed_mind" | "defective" | "other";

export interface ReturnItem {
  itemId: string;
  itemName: string;
  quantity: number;
  condition: "new" | "damaged" | "used";
}

export interface ReturnOrder {
  id: string;
  returnId: string;
  originalShipmentId: string;
  customerName: string;
  reason: ReturnReason;
  status: ReturnStatus;
  items: ReturnItem[];
  requestedDate: string;
  pickupDate?: string;
  receivedDate?: string;
  refundAmount: number;
  warehouseId: string;
  notes: string;
  d365ExternalId?: string;
}
