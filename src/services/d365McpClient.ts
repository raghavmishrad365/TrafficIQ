import { env } from "../config/env";
import { isDemoModeEnabled } from "./demoMode";
import { storageService } from "./storageService";
import type {
  Shipment,
  Warehouse,
  InventoryItem,
  ShipmentStatus,
  FleetVehicle,
  WorkOrder,
  Technician,
  SupplyChainKPIs,
  ExceptionAlert,
  ScheduleSlot,
  ShipmentTracking,
  VehicleHealth,
  MaintenanceAlert,
  MaintenanceRecord,
  ReturnOrder,
} from "../types/supplychain";
import { ShipmentStatusOption } from "../generated/models/ShipmentModel";
import { WorkOrderStatusOption } from "../generated/models/WorkOrderModel";
import { ReturnStatusOption } from "../generated/models/ReturnOrderModel";

/**
 * Client for D365 Finance & Operations MCP Server.
 * Connects to the Dynamics 365 ERP MCP server to perform CRUD operations
 * on warehouse, shipment, and inventory entities.
 *
 * When D365 F&O is not available, falls back to mock data for development/demo.
 */

// --- D365 MCP tool call interface ---

interface McpToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

class D365McpClient {
  private baseUrl: string | null = null;
  private useMockData = true;

  initialize() {
    this.baseUrl = env.d365FoUrl || null;
    this.useMockData = !this.baseUrl;
    if (this.useMockData) {
      console.log("[D365MCP] No D365 F&O URL configured, using mock data");
    } else {
      console.log(`[D365MCP] Connected to ${this.baseUrl}`);
    }
  }

  /** Check if mock data should be used: global demo mode OR no live connection */
  private shouldUseMock(): boolean {
    return isDemoModeEnabled() || this.useMockData;
  }

  /** Call a D365 MCP tool via the Dataverse proxy or direct API */
  private async callMcpTool(toolName: string, params: Record<string, unknown>): Promise<McpToolResult> {
    if (this.shouldUseMock()) {
      return { success: true, data: null };
    }

    try {
      const response = await fetch(`/api/d365-mcp/${toolName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, error: `D365 MCP call failed (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "D365 MCP connection failed",
      };
    }
  }

  // --- Mock Data for Demo ---

  private getMockShipments(warehouseId?: string, status?: string): Shipment[] {
    const allShipments: Shipment[] = [
      {
        id: "1",
        shipmentId: "SH-2026-001",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Distribution Center" },
        customerName: "Nordic Logistics A/S",
        status: "in_transit",
        scheduledDate: "2026-02-27",
        estimatedArrival: "2026-02-27T14:30:00Z",
        actualDeparture: "2026-02-27T08:00:00Z",
        items: [
          { itemId: "ITM-001", itemName: "Electronic Components", quantity: 500, unit: "pcs", weight: 250 },
          { itemId: "ITM-002", itemName: "Circuit Boards", quantity: 200, unit: "pcs", weight: 100 },
        ],
        totalWeight: 350,
        currentTrafficDelay: 12,
        routeDistanceKm: 312,
        routeDurationMinutes: 195,
        priority: "express",
      },
      {
        id: "2",
        shipmentId: "SH-2026-002",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 55.403, lng: 10.388 }, label: "Odense Retail Hub" },
        customerName: "Danish Retail Group",
        status: "packed",
        scheduledDate: "2026-02-27",
        items: [
          { itemId: "ITM-003", itemName: "Consumer Electronics", quantity: 150, unit: "pcs", weight: 450 },
        ],
        totalWeight: 450,
        routeDistanceKm: 167,
        routeDurationMinutes: 105,
        priority: "standard",
      },
      {
        id: "3",
        shipmentId: "SH-2026-003",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 57.048, lng: 9.921 }, label: "Aalborg North Terminal" },
        customerName: "Aalborg Industrial A/S",
        status: "pending",
        scheduledDate: "2026-02-28",
        items: [
          { itemId: "ITM-004", itemName: "Industrial Sensors", quantity: 1000, unit: "pcs", weight: 200 },
          { itemId: "ITM-005", itemName: "Cable Assemblies", quantity: 300, unit: "m", weight: 150 },
        ],
        totalWeight: 350,
        routeDistanceKm: 468,
        routeDurationMinutes: 285,
        priority: "standard",
      },
      {
        id: "4",
        shipmentId: "SH-2026-004",
        warehouseId: "DK02",
        warehouseName: "Aarhus Regional Warehouse",
        origin: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        destination: { coordinates: { lat: 55.860, lng: 9.837 }, label: "Vejle Business Park" },
        customerName: "Vejle Tech Solutions",
        status: "in_transit",
        scheduledDate: "2026-02-27",
        estimatedArrival: "2026-02-27T11:00:00Z",
        actualDeparture: "2026-02-27T09:30:00Z",
        items: [
          { itemId: "ITM-006", itemName: "Server Components", quantity: 50, unit: "pcs", weight: 500 },
        ],
        totalWeight: 500,
        currentTrafficDelay: 5,
        routeDistanceKm: 82,
        routeDurationMinutes: 55,
        priority: "urgent",
      },
      {
        id: "5",
        shipmentId: "SH-2026-005",
        warehouseId: "DK02",
        warehouseName: "Aarhus Regional Warehouse",
        origin: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        destination: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Distribution Hub" },
        customerName: "CPH Distribution",
        status: "delayed",
        scheduledDate: "2026-02-27",
        estimatedArrival: "2026-02-27T16:45:00Z",
        actualDeparture: "2026-02-27T07:00:00Z",
        items: [
          { itemId: "ITM-007", itemName: "Medical Supplies", quantity: 800, unit: "pcs", weight: 320 },
        ],
        totalWeight: 320,
        currentTrafficDelay: 35,
        routeDistanceKm: 312,
        routeDurationMinutes: 230,
        priority: "urgent",
      },
      {
        id: "6",
        shipmentId: "SH-2026-006",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 55.476, lng: 8.459 }, label: "Esbjerg Port Terminal" },
        customerName: "West Coast Shipping ApS",
        status: "in_transit",
        scheduledDate: "2026-02-28",
        estimatedArrival: "2026-02-28T15:00:00Z",
        actualDeparture: "2026-02-28T07:30:00Z",
        items: [
          { itemId: "ITM-008", itemName: "Marine Navigation Equipment", quantity: 25, unit: "pcs", weight: 375 },
          { itemId: "ITM-009", itemName: "Anchor Chain Links", quantity: 100, unit: "pcs", weight: 800 },
        ],
        totalWeight: 1175,
        currentTrafficDelay: 8,
        routeDistanceKm: 298,
        routeDurationMinutes: 210,
        priority: "express",
      },
      {
        id: "7",
        shipmentId: "SH-2026-007",
        warehouseId: "DK02",
        warehouseName: "Aarhus Regional Warehouse",
        origin: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        destination: { coordinates: { lat: 55.490, lng: 9.472 }, label: "Kolding Logistics Park" },
        customerName: "Triangle Region Supplies",
        status: "packed",
        scheduledDate: "2026-02-28",
        items: [
          { itemId: "ITM-010", itemName: "Warehouse Shelving Units", quantity: 40, unit: "pcs", weight: 1200 },
          { itemId: "ITM-011", itemName: "Packing Foam Rolls", quantity: 200, unit: "pcs", weight: 60 },
        ],
        totalWeight: 1260,
        routeDistanceKm: 114,
        routeDurationMinutes: 80,
        priority: "standard",
      },
      {
        id: "8",
        shipmentId: "SH-2026-008",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 55.642, lng: 12.080 }, label: "Roskilde Medical Center" },
        customerName: "Zealand Health Solutions",
        status: "pending",
        scheduledDate: "2026-03-01",
        items: [
          { itemId: "ITM-012", itemName: "Portable Ultrasound Devices", quantity: 10, unit: "pcs", weight: 150 },
          { itemId: "ITM-013", itemName: "Sterile Surgical Kits", quantity: 500, unit: "pcs", weight: 200 },
          { itemId: "ITM-014", itemName: "Patient Monitoring Modules", quantity: 30, unit: "pcs", weight: 90 },
        ],
        totalWeight: 440,
        routeDistanceKm: 35,
        routeDurationMinutes: 30,
        priority: "urgent",
      },
      {
        id: "9",
        shipmentId: "SH-2026-009",
        warehouseId: "DK02",
        warehouseName: "Aarhus Regional Warehouse",
        origin: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        destination: { coordinates: { lat: 56.137, lng: 8.977 }, label: "Herning Textile Warehouse" },
        customerName: "Midtjylland Fashion Group",
        status: "delivered",
        scheduledDate: "2026-02-26",
        estimatedArrival: "2026-02-26T13:00:00Z",
        actualDeparture: "2026-02-26T09:00:00Z",
        items: [
          { itemId: "ITM-015", itemName: "Fabric Bolts", quantity: 300, unit: "pcs", weight: 900 },
          { itemId: "ITM-016", itemName: "Garment Hangers", quantity: 2000, unit: "pcs", weight: 120 },
        ],
        totalWeight: 1020,
        routeDistanceKm: 95,
        routeDurationMinutes: 70,
        priority: "standard",
      },
      {
        id: "10",
        shipmentId: "SH-2026-010",
        warehouseId: "DK01",
        warehouseName: "Copenhagen Central Warehouse",
        origin: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        destination: { coordinates: { lat: 55.566, lng: 9.752 }, label: "Fredericia Distribution Hub" },
        customerName: "Jutland Express A/S",
        status: "in_transit",
        scheduledDate: "2026-02-28",
        estimatedArrival: "2026-02-28T13:45:00Z",
        actualDeparture: "2026-02-28T08:15:00Z",
        items: [
          { itemId: "ITM-017", itemName: "Distribution Center Automation Parts", quantity: 75, unit: "pcs", weight: 560 },
          { itemId: "ITM-018", itemName: "Barcode Scanners", quantity: 50, unit: "pcs", weight: 25 },
        ],
        totalWeight: 585,
        currentTrafficDelay: 15,
        routeDistanceKm: 232,
        routeDurationMinutes: 165,
        priority: "standard",
      },
    ];

    let filtered = allShipments;
    if (warehouseId) {
      filtered = filtered.filter(s => s.warehouseId === warehouseId);
    }
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }
    return filtered;
  }

  private getMockWarehouses(): Warehouse[] {
    return [
      {
        id: "DK01",
        name: "Copenhagen Central Warehouse",
        location: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        activeShipments: 3,
        pendingShipments: 1,
        totalInventoryItems: 1250,
      },
      {
        id: "DK02",
        name: "Aarhus Regional Warehouse",
        location: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        activeShipments: 2,
        pendingShipments: 0,
        totalInventoryItems: 840,
      },
      {
        id: "DK03",
        name: "Odense Distribution Center",
        location: { coordinates: { lat: 55.403, lng: 10.388 }, label: "Odense Distribution Center" },
        activeShipments: 1,
        pendingShipments: 2,
        totalInventoryItems: 620,
      },
      {
        id: "DK04",
        name: "Aalborg North Terminal",
        location: { coordinates: { lat: 57.048, lng: 9.921 }, label: "Aalborg North Terminal" },
        activeShipments: 1,
        pendingShipments: 1,
        totalInventoryItems: 450,
      },
    ];
  }

  private getMockInventory(warehouseId: string): InventoryItem[] {
    const inventory: Record<string, InventoryItem[]> = {
      DK01: [
        { itemId: "ITM-001", itemName: "Electronic Components", warehouseId: "DK01", quantityOnHand: 5000, quantityReserved: 500, quantityAvailable: 4500, unit: "pcs", reorderPoint: 1000, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-002", itemName: "Circuit Boards", warehouseId: "DK01", quantityOnHand: 2000, quantityReserved: 200, quantityAvailable: 1800, unit: "pcs", reorderPoint: 500, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-003", itemName: "Consumer Electronics", warehouseId: "DK01", quantityOnHand: 800, quantityReserved: 150, quantityAvailable: 650, unit: "pcs", reorderPoint: 200, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-004", itemName: "Industrial Sensors", warehouseId: "DK01", quantityOnHand: 3000, quantityReserved: 1000, quantityAvailable: 2000, unit: "pcs", reorderPoint: 800, lastUpdated: "2026-02-27T06:00:00Z" },
      ],
      DK02: [
        { itemId: "ITM-006", itemName: "Server Components", warehouseId: "DK02", quantityOnHand: 300, quantityReserved: 50, quantityAvailable: 250, unit: "pcs", reorderPoint: 100, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-007", itemName: "Medical Supplies", warehouseId: "DK02", quantityOnHand: 2500, quantityReserved: 800, quantityAvailable: 1700, unit: "pcs", reorderPoint: 600, lastUpdated: "2026-02-27T06:00:00Z" },
      ],
      DK03: [
        { itemId: "ITM-019", itemName: "Packaging Materials", warehouseId: "DK03", quantityOnHand: 4000, quantityReserved: 500, quantityAvailable: 3500, unit: "pcs", reorderPoint: 800, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-020", itemName: "Cold Chain Containers", warehouseId: "DK03", quantityOnHand: 150, quantityReserved: 30, quantityAvailable: 120, unit: "pcs", reorderPoint: 40, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-021", itemName: "Label Rolls", warehouseId: "DK03", quantityOnHand: 1200, quantityReserved: 200, quantityAvailable: 1000, unit: "pcs", reorderPoint: 300, lastUpdated: "2026-02-27T06:00:00Z" },
      ],
      DK04: [
        { itemId: "ITM-022", itemName: "Industrial Sensors", warehouseId: "DK04", quantityOnHand: 600, quantityReserved: 100, quantityAvailable: 500, unit: "pcs", reorderPoint: 150, lastUpdated: "2026-02-27T06:00:00Z" },
        { itemId: "ITM-023", itemName: "Safety Equipment", warehouseId: "DK04", quantityOnHand: 350, quantityReserved: 50, quantityAvailable: 300, unit: "pcs", reorderPoint: 80, lastUpdated: "2026-02-27T06:00:00Z" },
      ],
    };
    return inventory[warehouseId] || [];
  }

  private getMockFleet(): FleetVehicle[] {
    return [
      {
        id: "FV-001", vehicleId: "TRK-101", licensePlate: "AB 12 345",
        driverName: "Lars Nielsen", driverId: "DRV-01",
        status: "in_transit",
        currentLocation: { coordinates: { lat: 55.82, lng: 11.45 }, label: "E20 near Ringsted" },
        assignedRoute: "CPH → Odense", currentShipmentId: "SH-2026-002",
        loadPercent: 85, speedKmh: 82, fuelLevelPercent: 64, hoursOnDuty: 4.5, distanceTodayKm: 187,
      },
      {
        id: "FV-002", vehicleId: "TRK-102", licensePlate: "CD 34 567",
        driverName: "Mette Andersen", driverId: "DRV-02",
        status: "in_transit",
        currentLocation: { coordinates: { lat: 56.05, lng: 10.8 }, label: "E45 near Skanderborg" },
        assignedRoute: "CPH → Aarhus", currentShipmentId: "SH-2026-001",
        loadPercent: 72, speedKmh: 95, fuelLevelPercent: 45, hoursOnDuty: 3.2, distanceTodayKm: 245,
      },
      {
        id: "FV-003", vehicleId: "TRK-103", licensePlate: "EF 56 789",
        driverName: "Henrik Jørgensen", driverId: "DRV-03",
        status: "idle",
        currentLocation: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        loadPercent: 0, speedKmh: 0, fuelLevelPercent: 92, hoursOnDuty: 1.0, distanceTodayKm: 0,
      },
      {
        id: "FV-004", vehicleId: "TRK-104", licensePlate: "GH 78 901",
        driverName: "Søren Petersen", driverId: "DRV-04",
        status: "returning",
        currentLocation: { coordinates: { lat: 55.48, lng: 9.47 }, label: "E20 near Kolding" },
        assignedRoute: "Vejle → CPH",
        loadPercent: 0, speedKmh: 88, fuelLevelPercent: 31, hoursOnDuty: 6.8, distanceTodayKm: 412,
      },
      {
        id: "FV-005", vehicleId: "TRK-105", licensePlate: "JK 90 123",
        driverName: "Peter Christensen", driverId: "DRV-05",
        status: "maintenance",
        currentLocation: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        loadPercent: 0, speedKmh: 0, fuelLevelPercent: 78, hoursOnDuty: 0, distanceTodayKm: 0,
      },
      {
        id: "FV-006", vehicleId: "VAN-201", licensePlate: "LM 12 456",
        driverName: "Anne Sørensen", driverId: "DRV-06",
        status: "in_transit",
        currentLocation: { coordinates: { lat: 56.88, lng: 9.82 }, label: "E45 near Hobro" },
        assignedRoute: "Aarhus → Aalborg", currentShipmentId: "SH-2026-003",
        loadPercent: 60, speedKmh: 78, fuelLevelPercent: 55, hoursOnDuty: 2.1, distanceTodayKm: 98,
      },
      {
        id: "FV-007", vehicleId: "TRK-106", licensePlate: "NP 34 678",
        driverName: "Christian Dam", driverId: "DRV-07",
        status: "in_transit",
        currentLocation: { coordinates: { lat: 55.52, lng: 8.85 }, label: "E20 near Esbjerg" },
        assignedRoute: "CPH → Esbjerg", currentShipmentId: "SH-2026-006",
        loadPercent: 90, speedKmh: 86, fuelLevelPercent: 42, hoursOnDuty: 5.5, distanceTodayKm: 265,
      },
      {
        id: "FV-008", vehicleId: "VAN-202", licensePlate: "QR 56 890",
        driverName: "Louise Eriksen", driverId: "DRV-08",
        status: "idle",
        currentLocation: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        assignedRoute: "Loading at CPH Central",
        loadPercent: 45, speedKmh: 0, fuelLevelPercent: 88, hoursOnDuty: 1.5, distanceTodayKm: 0,
      },
      {
        id: "FV-009", vehicleId: "TRK-107", licensePlate: "ST 78 012",
        driverName: "Rasmus Møller", driverId: "DRV-09",
        status: "returning",
        currentLocation: { coordinates: { lat: 55.63, lng: 12.10 }, label: "Roskilde Motorvej near Roskilde" },
        assignedRoute: "Roskilde → CPH",
        loadPercent: 0, speedKmh: 90, fuelLevelPercent: 53, hoursOnDuty: 4.0, distanceTodayKm: 152,
      },
      {
        id: "FV-010", vehicleId: "VAN-203", licensePlate: "UV 90 234",
        driverName: "Camilla Holm", driverId: "DRV-10",
        status: "idle",
        currentLocation: { coordinates: { lat: 57.048, lng: 9.921 }, label: "Aalborg North Terminal" },
        loadPercent: 0, speedKmh: 0, fuelLevelPercent: 95, hoursOnDuty: 0.5, distanceTodayKm: 0,
      },
    ];
  }

  private getMockWorkOrders(): WorkOrder[] {
    return [
      {
        id: "WO-001", workOrderId: "WO-2026-001", customerName: "Nordic Logistics A/S",
        serviceType: "Preventive Maintenance", priority: "high",
        requiredSkills: ["HVAC", "Electrical"], status: "scheduled",
        location: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Central Warehouse" },
        estimatedDuration: 120, scheduledDate: "2026-02-28", assignedTechnicianId: "TECH-01",
        description: "Quarterly HVAC system maintenance and filter replacement",
        createdDate: "2026-02-25",
      },
      {
        id: "WO-002", workOrderId: "WO-2026-002", customerName: "Danish Retail Group",
        serviceType: "Repair", priority: "critical",
        requiredSkills: ["Refrigeration", "Electrical"], status: "in_progress",
        location: { coordinates: { lat: 55.403, lng: 10.388 }, label: "Odense Retail Hub" },
        estimatedDuration: 180, scheduledDate: "2026-02-28", assignedTechnicianId: "TECH-02",
        description: "Cold storage unit failure — temperature rising, urgent repair required",
        createdDate: "2026-02-27",
      },
      {
        id: "WO-003", workOrderId: "WO-2026-003", customerName: "Aalborg Industrial A/S",
        serviceType: "Installation", priority: "medium",
        requiredSkills: ["IoT", "Networking"], status: "unscheduled",
        location: { coordinates: { lat: 57.048, lng: 9.921 }, label: "Aalborg North Terminal" },
        estimatedDuration: 240,
        description: "Install new IoT sensor array for warehouse temperature monitoring",
        createdDate: "2026-02-26",
      },
      {
        id: "WO-004", workOrderId: "WO-2026-004", customerName: "Vejle Tech Solutions",
        serviceType: "Inspection", priority: "low",
        requiredSkills: ["Safety", "Electrical"], status: "scheduled",
        location: { coordinates: { lat: 55.860, lng: 9.837 }, label: "Vejle Business Park" },
        estimatedDuration: 90, scheduledDate: "2026-03-01", assignedTechnicianId: "TECH-03",
        description: "Annual safety inspection of loading dock equipment",
        createdDate: "2026-02-24",
      },
      {
        id: "WO-005", workOrderId: "WO-2026-005", customerName: "CPH Distribution",
        serviceType: "Repair", priority: "high",
        requiredSkills: ["Conveyor", "Mechanical"], status: "unscheduled",
        location: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Distribution Hub" },
        estimatedDuration: 150,
        description: "Conveyor belt sorting system malfunction on Line 3",
        createdDate: "2026-02-27",
      },
      {
        id: "WO-006", workOrderId: "WO-2026-006", customerName: "Nordic Logistics A/S",
        serviceType: "Calibration", priority: "medium",
        requiredSkills: ["IoT", "Calibration"], status: "completed",
        location: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        estimatedDuration: 60, scheduledDate: "2026-02-27", assignedTechnicianId: "TECH-01",
        description: "Recalibrate weighbridge and pallet scales",
        createdDate: "2026-02-23",
      },
      {
        id: "WO-007", workOrderId: "WO-2026-007", customerName: "West Coast Shipping ApS",
        serviceType: "Repair", priority: "critical",
        requiredSkills: ["Crane", "Hydraulic"], status: "unscheduled",
        location: { coordinates: { lat: 55.476, lng: 8.459 }, label: "Esbjerg Port Terminal" },
        estimatedDuration: 300,
        description: "Esbjerg Port Crane Service — gantry crane hydraulic cylinder leak detected, crane offline",
        createdDate: "2026-02-28",
      },
      {
        id: "WO-008", workOrderId: "WO-2026-008", customerName: "Zealand Health Solutions",
        serviceType: "Inspection", priority: "high",
        requiredSkills: ["Safety", "Fire Systems"], status: "scheduled",
        location: { coordinates: { lat: 55.642, lng: 12.080 }, label: "Roskilde Medical Center" },
        estimatedDuration: 180, scheduledDate: "2026-03-02", assignedTechnicianId: "TECH-07",
        description: "Fire Suppression System Test — annual compliance inspection of medical facility fire suppression system",
        createdDate: "2026-02-26",
      },
      {
        id: "WO-009", workOrderId: "WO-2026-009", customerName: "Midtjylland Fashion Group",
        serviceType: "Inspection", priority: "medium",
        requiredSkills: ["Safety", "Structural"], status: "in_progress",
        location: { coordinates: { lat: 56.137, lng: 8.977 }, label: "Herning Textile Warehouse" },
        estimatedDuration: 120, scheduledDate: "2026-02-28", assignedTechnicianId: "TECH-08",
        description: "Pallet Racking Inspection — structural integrity check of high-bay racking system after load incident",
        createdDate: "2026-02-27",
      },
      {
        id: "WO-010", workOrderId: "WO-2026-010", customerName: "Jutland Express A/S",
        serviceType: "Preventive Maintenance", priority: "low",
        requiredSkills: ["Electrical", "Solar"], status: "completed",
        location: { coordinates: { lat: 55.566, lng: 9.752 }, label: "Fredericia Distribution Hub" },
        estimatedDuration: 90, scheduledDate: "2026-02-27", assignedTechnicianId: "TECH-08",
        description: "Solar Panel Maintenance — cleaning and output verification of rooftop solar array",
        createdDate: "2026-02-22",
      },
    ];
  }

  private getMockTechnicians(): Technician[] {
    return [
      {
        id: "TECH-01", name: "Erik Hansen",
        skills: ["HVAC", "Electrical", "IoT", "Calibration"],
        status: "on_job",
        currentLocation: { coordinates: { lat: 56.162, lng: 10.203 }, label: "Aarhus Regional Warehouse" },
        todayWorkOrders: 3, completedToday: 1, phone: "+45 2345 6789",
      },
      {
        id: "TECH-02", name: "Maria Thomsen",
        skills: ["Refrigeration", "Electrical", "HVAC"],
        status: "on_job",
        currentLocation: { coordinates: { lat: 55.403, lng: 10.388 }, label: "Odense Retail Hub" },
        todayWorkOrders: 2, completedToday: 0, phone: "+45 3456 7890",
      },
      {
        id: "TECH-03", name: "Jakob Madsen",
        skills: ["Safety", "Electrical", "Mechanical", "Conveyor"],
        status: "available",
        currentLocation: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Office" },
        todayWorkOrders: 1, completedToday: 0, phone: "+45 4567 8901",
      },
      {
        id: "TECH-04", name: "Katrine Olsen",
        skills: ["IoT", "Networking", "Calibration"],
        status: "available",
        currentLocation: { coordinates: { lat: 55.676, lng: 12.568 }, label: "Copenhagen Office" },
        todayWorkOrders: 0, completedToday: 0, phone: "+45 5678 9012",
      },
      {
        id: "TECH-05", name: "Thomas Rasmussen",
        skills: ["Mechanical", "Conveyor", "Safety"],
        status: "off_duty",
        currentLocation: { coordinates: { lat: 55.860, lng: 9.837 }, label: "Vejle" },
        todayWorkOrders: 0, completedToday: 2, phone: "+45 6789 0123",
      },
      {
        id: "TECH-06", name: "Nikolaj Svendsen",
        skills: ["Crane", "Hydraulic", "Mechanical"],
        status: "on_job",
        currentLocation: { coordinates: { lat: 55.476, lng: 8.459 }, label: "Esbjerg Port Terminal" },
        todayWorkOrders: 2, completedToday: 0, phone: "+45 7890 1234",
      },
      {
        id: "TECH-07", name: "Line Frederiksen",
        skills: ["Safety", "Fire Systems", "Structural"],
        status: "available",
        currentLocation: { coordinates: { lat: 55.642, lng: 12.080 }, label: "Roskilde" },
        todayWorkOrders: 1, completedToday: 0, phone: "+45 8901 2345",
      },
      {
        id: "TECH-08", name: "Christian Kjær",
        skills: ["Electrical", "Solar", "IoT"],
        status: "on_job",
        currentLocation: { coordinates: { lat: 56.137, lng: 8.977 }, label: "Herning" },
        todayWorkOrders: 2, completedToday: 1, phone: "+45 9012 3456",
      },
    ];
  }

  private getMockKPIs(): SupplyChainKPIs {
    return {
      onTimeDeliveryRate: 87.5,
      avgDeliveryTimeMinutes: 165,
      activeShipments: 5,
      delayedShipments: 1,
      costPerKm: 4.85,
      slaComplianceRate: 92.3,
      warehouseUtilization: 78.4,
      fleetUtilization: 66.7,
      totalDeliveriesToday: 12,
      pendingWorkOrders: 3,
    };
  }

  private getMockExceptionAlerts(): ExceptionAlert[] {
    return [
      {
        id: "EX-001", type: "delay", severity: "high",
        title: "Shipment SH-2026-005 delayed 35 min",
        description: "Heavy traffic on E45 causing significant delay for Aarhus → Copenhagen route. Medical supplies shipment.",
        relatedEntityId: "SH-2026-005", timestamp: "2026-02-28T09:15:00Z",
      },
      {
        id: "EX-002", type: "stock", severity: "medium",
        title: "Low stock: Server Components (DK02)",
        description: "Server Components at Aarhus Regional Warehouse approaching reorder point. 250 available, reorder at 100.",
        relatedEntityId: "ITM-006", timestamp: "2026-02-28T08:30:00Z",
      },
      {
        id: "EX-003", type: "maintenance", severity: "critical",
        title: "Cold storage failure at Odense",
        description: "Cold storage unit at Odense Retail Hub has failed. Work order WO-2026-002 created for urgent repair.",
        relatedEntityId: "WO-2026-002", timestamp: "2026-02-28T07:45:00Z",
      },
      {
        id: "EX-004", type: "sla", severity: "high",
        title: "SLA breach risk: Aalborg Industrial delivery",
        description: "Shipment SH-2026-003 to Aalborg Industrial A/S at risk of missing 2-day SLA window.",
        relatedEntityId: "SH-2026-003", timestamp: "2026-02-28T10:00:00Z",
      },
      {
        id: "EX-005", type: "weather", severity: "medium",
        title: "Weather advisory: Strong winds Jutland",
        description: "MET Office reports strong winds (15-20 m/s) across Jutland. May affect delivery times for western routes.",
        timestamp: "2026-02-28T06:00:00Z",
      },
      {
        id: "EX-006", type: "maintenance", severity: "critical",
        title: "Esbjerg port crane offline",
        description: "Gantry crane at Esbjerg Port Terminal has hydraulic cylinder leak. Work order WO-2026-007 created — port operations delayed.",
        relatedEntityId: "WO-2026-007", timestamp: "2026-02-28T08:15:00Z",
      },
      {
        id: "EX-007", type: "delay", severity: "medium",
        title: "Shipment SH-2026-010 delayed 15 min",
        description: "Road construction on E20 near Fredericia causing moderate delay for Copenhagen → Fredericia route.",
        relatedEntityId: "SH-2026-010", timestamp: "2026-02-28T10:30:00Z",
      },
      {
        id: "EX-008", type: "sla", severity: "high",
        title: "Urgent medical shipment pending: Roskilde",
        description: "Shipment SH-2026-008 (medical equipment) to Roskilde Medical Center still in pending status. Priority urgent — must ship by 2026-03-01.",
        relatedEntityId: "SH-2026-008", timestamp: "2026-02-28T11:00:00Z",
      },
    ];
  }

  private getMockScheduleSlots(): ScheduleSlot[] {
    return [
      { workOrderId: "WO-2026-001", technicianId: "TECH-01", startHour: 8, durationHours: 2, priority: "high", customerName: "Nordic Logistics A/S", serviceType: "Preventive Maintenance" },
      { workOrderId: "WO-2026-002", technicianId: "TECH-02", startHour: 7, durationHours: 3, priority: "critical", customerName: "Danish Retail Group", serviceType: "Repair" },
      { workOrderId: "WO-2026-004", technicianId: "TECH-03", startHour: 10, durationHours: 1.5, priority: "low", customerName: "Vejle Tech Solutions", serviceType: "Inspection" },
      { workOrderId: "WO-2026-006", technicianId: "TECH-01", startHour: 11, durationHours: 1, priority: "medium", customerName: "Nordic Logistics A/S", serviceType: "Calibration" },
      { workOrderId: "WO-EXTRA-01", technicianId: "TECH-03", startHour: 13, durationHours: 2, priority: "medium", customerName: "Aarhus Pharma", serviceType: "Installation" },
      { workOrderId: "WO-EXTRA-02", technicianId: "TECH-01", startHour: 14, durationHours: 1.5, priority: "high", customerName: "CPH Airport Services", serviceType: "Repair" },
      { workOrderId: "WO-2026-008", technicianId: "TECH-07", startHour: 9, durationHours: 3, priority: "high", customerName: "Zealand Health Solutions", serviceType: "Inspection" },
      { workOrderId: "WO-2026-009", technicianId: "TECH-08", startHour: 8, durationHours: 2, priority: "medium", customerName: "Midtjylland Fashion Group", serviceType: "Inspection" },
      { workOrderId: "WO-2026-010", technicianId: "TECH-08", startHour: 13, durationHours: 1.5, priority: "low", customerName: "Jutland Express A/S", serviceType: "Preventive Maintenance" },
    ];
  }

  private getMockShipmentTracking(shipmentId: string): ShipmentTracking | null {
    const trackingData: Record<string, ShipmentTracking> = {
      "SH-2026-001": {
        shipmentId: "SH-2026-001",
        events: [
          { status: "Order Placed", timestamp: "2026-02-27T08:00:00Z", location: "Copenhagen", description: "Order received from customer" },
          { status: "Picked", timestamp: "2026-02-27T10:30:00Z", location: "DK01 — Copenhagen Central", description: "Items picked from warehouse shelves" },
          { status: "Packed", timestamp: "2026-02-27T12:15:00Z", location: "DK01 — Copenhagen Central", description: "Order packed and labeled for shipping" },
          { status: "In Transit", timestamp: "2026-02-28T06:00:00Z", location: "E45 near Skanderborg", description: "Driver Mette Andersen en route to Aarhus" },
        ],
        currentLocation: { coordinates: { lat: 56.05, lng: 10.8 }, label: "E45 near Skanderborg" },
        estimatedDelivery: "2026-02-28T14:30:00Z",
      },
      "SH-2026-002": {
        shipmentId: "SH-2026-002",
        events: [
          { status: "Order Placed", timestamp: "2026-02-27T09:00:00Z", location: "Copenhagen", description: "Order received — electronics shipment" },
          { status: "Picked", timestamp: "2026-02-27T11:00:00Z", location: "DK01 — Copenhagen Central", description: "Items picked from warehouse" },
          { status: "Packed", timestamp: "2026-02-27T13:00:00Z", location: "DK01 — Copenhagen Central", description: "Packed with fragile handling" },
          { status: "In Transit", timestamp: "2026-02-28T07:00:00Z", location: "E20 near Ringsted", description: "Driver Lars Nielsen heading to Odense" },
        ],
        currentLocation: { coordinates: { lat: 55.82, lng: 11.45 }, label: "E20 near Ringsted" },
        estimatedDelivery: "2026-02-28T12:00:00Z",
      },
      "SH-2026-004": {
        shipmentId: "SH-2026-004",
        events: [
          { status: "Order Placed", timestamp: "2026-02-25T08:00:00Z", location: "Odense", description: "Order received" },
          { status: "Picked", timestamp: "2026-02-25T10:00:00Z", location: "DK01 — Copenhagen Central", description: "Items picked" },
          { status: "Packed", timestamp: "2026-02-25T12:00:00Z", location: "DK01 — Copenhagen Central", description: "Packed for delivery" },
          { status: "In Transit", timestamp: "2026-02-26T07:00:00Z", location: "E20 highway", description: "En route to Odense" },
          { status: "Delivered", timestamp: "2026-02-26T11:30:00Z", location: "Odense Retail Hub", description: "Delivered to receiving dock" },
        ],
        estimatedDelivery: "2026-02-26T12:00:00Z",
        proofOfDelivery: { signature: true, photo: true, timestamp: "2026-02-26T11:30:00Z" },
      },
      "SH-2026-006": {
        shipmentId: "SH-2026-006",
        events: [
          { status: "Order Placed", timestamp: "2026-02-27T14:00:00Z", location: "Copenhagen", description: "Order received from West Coast Shipping ApS" },
          { status: "Picked", timestamp: "2026-02-27T16:30:00Z", location: "DK01 — Copenhagen Central", description: "Marine equipment picked from warehouse" },
          { status: "Packed", timestamp: "2026-02-28T06:00:00Z", location: "DK01 — Copenhagen Central", description: "Heavy items palletised and secured for transit" },
          { status: "In Transit", timestamp: "2026-02-28T07:30:00Z", location: "E20 near Esbjerg", description: "Driver Christian Dam en route to Esbjerg Port Terminal" },
        ],
        currentLocation: { coordinates: { lat: 55.52, lng: 8.85 }, label: "E20 near Esbjerg" },
        estimatedDelivery: "2026-02-28T15:00:00Z",
      },
      "SH-2026-010": {
        shipmentId: "SH-2026-010",
        events: [
          { status: "Order Placed", timestamp: "2026-02-27T10:00:00Z", location: "Copenhagen", description: "Order received from Jutland Express A/S" },
          { status: "Picked", timestamp: "2026-02-27T14:00:00Z", location: "DK01 — Copenhagen Central", description: "Automation parts and scanners picked" },
          { status: "Packed", timestamp: "2026-02-28T06:45:00Z", location: "DK01 — Copenhagen Central", description: "Packed and loaded onto TRK vehicle" },
          { status: "In Transit", timestamp: "2026-02-28T08:15:00Z", location: "E20 highway", description: "Departed Copenhagen — heading west to Fredericia" },
        ],
        currentLocation: { coordinates: { lat: 55.55, lng: 10.50 }, label: "E20 near Odense" },
        estimatedDelivery: "2026-02-28T13:45:00Z",
      },
    };
    return trackingData[shipmentId] || null;
  }

  private getMockVehicleHealth(): VehicleHealth[] {
    return [
      {
        vehicleId: "TRK-101", licensePlate: "AB 12 345", healthScore: 82,
        lastServiceDate: "2026-01-15", nextPredictedService: "2026-03-10",
        mileageKm: 145200, engineHours: 3420,
        alerts: [
          { id: "MA-001", vehicleId: "TRK-101", component: "brakes", severity: "medium", predictedFailureDate: "2026-03-15", confidencePercent: 78, recommendedAction: "Schedule brake pad replacement within 2 weeks", estimatedCost: 4500 },
        ],
      },
      {
        vehicleId: "TRK-102", licensePlate: "CD 34 567", healthScore: 65,
        lastServiceDate: "2025-12-20", nextPredictedService: "2026-03-01",
        mileageKm: 198500, engineHours: 4680,
        alerts: [
          { id: "MA-002", vehicleId: "TRK-102", component: "oil", severity: "high", predictedFailureDate: "2026-03-05", confidencePercent: 92, recommendedAction: "Oil change overdue — schedule immediately", estimatedCost: 1200 },
          { id: "MA-003", vehicleId: "TRK-102", component: "tires", severity: "medium", predictedFailureDate: "2026-03-20", confidencePercent: 71, recommendedAction: "Front tires showing wear — replace within 3 weeks", estimatedCost: 8000 },
        ],
      },
      {
        vehicleId: "TRK-103", licensePlate: "EF 56 789", healthScore: 95,
        lastServiceDate: "2026-02-10", nextPredictedService: "2026-04-15",
        mileageKm: 78300, engineHours: 1840,
        alerts: [],
      },
      {
        vehicleId: "TRK-104", licensePlate: "GH 78 901", healthScore: 54,
        lastServiceDate: "2025-11-05", nextPredictedService: "2026-02-28",
        mileageKm: 231000, engineHours: 5480,
        alerts: [
          { id: "MA-004", vehicleId: "TRK-104", component: "transmission", severity: "critical", predictedFailureDate: "2026-03-02", confidencePercent: 88, recommendedAction: "Transmission fluid analysis shows metal particles — pull from service for inspection", estimatedCost: 25000 },
          { id: "MA-005", vehicleId: "TRK-104", component: "battery", severity: "medium", predictedFailureDate: "2026-03-10", confidencePercent: 65, recommendedAction: "Battery voltage declining — test and replace if needed", estimatedCost: 3500 },
        ],
      },
      {
        vehicleId: "TRK-105", licensePlate: "JK 90 123", healthScore: 30,
        lastServiceDate: "2026-02-25", nextPredictedService: "2026-02-28",
        mileageKm: 167800, engineHours: 3950,
        alerts: [
          { id: "MA-006", vehicleId: "TRK-105", component: "coolant", severity: "critical", predictedFailureDate: "2026-03-01", confidencePercent: 95, recommendedAction: "Coolant leak detected — currently in maintenance bay", estimatedCost: 6000 },
        ],
      },
      {
        vehicleId: "VAN-201", licensePlate: "LM 12 456", healthScore: 88,
        lastServiceDate: "2026-02-01", nextPredictedService: "2026-04-01",
        mileageKm: 52100, engineHours: 1220,
        alerts: [
          { id: "MA-007", vehicleId: "VAN-201", component: "filters", severity: "low", predictedFailureDate: "2026-04-01", confidencePercent: 60, recommendedAction: "Air filter replacement at next scheduled service", estimatedCost: 800 },
        ],
      },
      {
        vehicleId: "TRK-106", licensePlate: "NP 34 678", healthScore: 74,
        lastServiceDate: "2026-01-20", nextPredictedService: "2026-03-20",
        mileageKm: 112400, engineHours: 2640,
        alerts: [
          { id: "MA-008", vehicleId: "TRK-106", component: "brakes", severity: "high", predictedFailureDate: "2026-03-08", confidencePercent: 82, recommendedAction: "Front brake discs showing excessive wear — schedule replacement", estimatedCost: 6500 },
        ],
      },
      {
        vehicleId: "VAN-202", licensePlate: "QR 56 890", healthScore: 91,
        lastServiceDate: "2026-02-15", nextPredictedService: "2026-04-20",
        mileageKm: 38700, engineHours: 910,
        alerts: [],
      },
      {
        vehicleId: "TRK-107", licensePlate: "ST 78 012", healthScore: 68,
        lastServiceDate: "2025-12-10", nextPredictedService: "2026-03-05",
        mileageKm: 176200, engineHours: 4150,
        alerts: [
          { id: "MA-009", vehicleId: "TRK-107", component: "oil", severity: "high", predictedFailureDate: "2026-03-06", confidencePercent: 87, recommendedAction: "Oil pressure dropping — schedule oil and filter change immediately", estimatedCost: 1400 },
          { id: "MA-010", vehicleId: "TRK-107", component: "battery", severity: "medium", predictedFailureDate: "2026-03-18", confidencePercent: 69, recommendedAction: "Battery cold-crank amps declining — test at next service", estimatedCost: 3200 },
        ],
      },
      {
        vehicleId: "VAN-203", licensePlate: "UV 90 234", healthScore: 85,
        lastServiceDate: "2026-02-05", nextPredictedService: "2026-04-10",
        mileageKm: 45600, engineHours: 1070,
        alerts: [
          { id: "MA-011", vehicleId: "VAN-203", component: "tires", severity: "low", predictedFailureDate: "2026-04-15", confidencePercent: 55, recommendedAction: "Rear tires approaching minimum tread depth — monitor and replace at next service", estimatedCost: 4000 },
        ],
      },
    ];
  }

  private getMockMaintenanceHistory(): MaintenanceRecord[] {
    return [
      { id: "MH-001", vehicleId: "TRK-101", serviceType: "Full Service", date: "2026-01-15", cost: 12500, technician: "Erik Hansen", notes: "Oil change, brake inspection, tire rotation" },
      { id: "MH-002", vehicleId: "TRK-102", serviceType: "Oil Change", date: "2025-12-20", cost: 1200, technician: "Jakob Madsen", notes: "Routine oil and filter change" },
      { id: "MH-003", vehicleId: "TRK-103", serviceType: "Full Service", date: "2026-02-10", cost: 15000, technician: "Maria Thomsen", notes: "Major service — all filters, fluids, brake pads replaced" },
      { id: "MH-004", vehicleId: "TRK-104", serviceType: "Tire Replacement", date: "2025-11-05", cost: 16000, technician: "Thomas Rasmussen", notes: "All four tires replaced — winter tires" },
      { id: "MH-005", vehicleId: "TRK-105", serviceType: "Emergency Repair", date: "2026-02-25", cost: 8500, technician: "Erik Hansen", notes: "Coolant system repair — hose replacement" },
      { id: "MH-006", vehicleId: "VAN-201", serviceType: "Routine Service", date: "2026-02-01", cost: 5500, technician: "Katrine Olsen", notes: "Oil change, tire pressure, light check" },
      { id: "MH-007", vehicleId: "TRK-101", serviceType: "Brake Service", date: "2025-10-20", cost: 9000, technician: "Jakob Madsen", notes: "Rear brake pads and rotors replaced" },
      { id: "MH-008", vehicleId: "TRK-106", serviceType: "Full Service", date: "2026-01-20", cost: 13500, technician: "Nikolaj Svendsen", notes: "Oil change, brake inspection, coolant top-up, tire rotation" },
      { id: "MH-009", vehicleId: "VAN-202", serviceType: "Routine Service", date: "2026-02-15", cost: 4800, technician: "Line Frederiksen", notes: "Oil change, brake fluid check, cabin air filter replaced" },
      { id: "MH-010", vehicleId: "TRK-107", serviceType: "Oil Change", date: "2025-12-10", cost: 1300, technician: "Christian Kjær", notes: "Routine oil and filter change — noted declining oil pressure" },
    ];
  }

  private getMockReturns(): ReturnOrder[] {
    return [
      {
        id: "RET-001", returnId: "RET-2026-001", originalShipmentId: "SH-2026-004",
        customerName: "Odense Retail Hub", reason: "damaged",
        status: "in_transit",
        items: [{ itemId: "ITM-002", itemName: "Smart Display Panels", quantity: 2, condition: "damaged" }],
        requestedDate: "2026-02-26", pickupDate: "2026-02-27",
        refundAmount: 14500, warehouseId: "DK01",
        notes: "Panels arrived with cracked screens — photos provided",
      },
      {
        id: "RET-002", returnId: "RET-2026-002", originalShipmentId: "SH-2026-001",
        customerName: "Aarhus Tech Center", reason: "wrong_item",
        status: "requested",
        items: [{ itemId: "ITM-003", itemName: "Industrial Sensors", quantity: 5, condition: "new" }],
        requestedDate: "2026-02-28",
        refundAmount: 7500, warehouseId: "DK02",
        notes: "Received wrong sensor model — ordered Type-B, received Type-A",
      },
      {
        id: "RET-003", returnId: "RET-2026-003", originalShipmentId: "SH-2026-003",
        customerName: "Aalborg Industrial A/S", reason: "quality_issue",
        status: "approved",
        items: [
          { itemId: "ITM-004", itemName: "Warehouse Robotics Parts", quantity: 1, condition: "used" },
          { itemId: "ITM-005", itemName: "Safety Equipment", quantity: 3, condition: "new" },
        ],
        requestedDate: "2026-02-25", pickupDate: "2026-03-01",
        refundAmount: 22000, warehouseId: "DK02",
        notes: "Robotics part does not meet specified torque requirements",
      },
      {
        id: "RET-004", returnId: "RET-2026-004", originalShipmentId: "SH-2026-002",
        customerName: "Copenhagen Electronics", reason: "changed_mind",
        status: "pickup_scheduled",
        items: [{ itemId: "ITM-001", itemName: "High-Capacity Batteries", quantity: 10, condition: "new" }],
        requestedDate: "2026-02-27", pickupDate: "2026-02-28",
        refundAmount: 5000, warehouseId: "DK01",
        notes: "Customer found alternative supplier — order no longer needed",
      },
      {
        id: "RET-005", returnId: "RET-2026-005", originalShipmentId: "SH-2026-005",
        customerName: "Vejle Medical Supplies", reason: "defective",
        status: "processed",
        items: [{ itemId: "ITM-007", itemName: "Medical Supplies", quantity: 50, condition: "damaged" }],
        requestedDate: "2026-02-20", pickupDate: "2026-02-22", receivedDate: "2026-02-24",
        refundAmount: 35000, warehouseId: "DK02",
        notes: "Temperature-sensitive items compromised during transit",
      },
      {
        id: "RET-006", returnId: "RET-2026-006", originalShipmentId: "SH-2026-004",
        customerName: "Odense Retail Hub", reason: "other",
        status: "rejected",
        items: [{ itemId: "ITM-006", itemName: "Server Components", quantity: 1, condition: "used" }],
        requestedDate: "2026-02-26",
        refundAmount: 0, warehouseId: "DK01",
        notes: "Return window exceeded — item was opened and used for 30+ days",
      },
      {
        id: "RET-007", returnId: "RET-2026-007", originalShipmentId: "SH-2026-006",
        customerName: "West Coast Shipping ApS", reason: "damaged",
        status: "requested",
        items: [{ itemId: "ITM-009", itemName: "Anchor Chain Links", quantity: 15, condition: "damaged" }],
        requestedDate: "2026-02-28",
        refundAmount: 9200, warehouseId: "DK01",
        notes: "Chain links arrived with visible corrosion and stress fractures — photos attached",
      },
      {
        id: "RET-008", returnId: "RET-2026-008", originalShipmentId: "SH-2026-009",
        customerName: "Midtjylland Fashion Group", reason: "wrong_item",
        status: "approved",
        items: [
          { itemId: "ITM-015", itemName: "Fabric Bolts", quantity: 20, condition: "new" },
        ],
        requestedDate: "2026-02-27", pickupDate: "2026-03-01",
        refundAmount: 6800, warehouseId: "DK02",
        notes: "Received cotton blend instead of requested polyester — customer needs correct material for production deadline",
      },
    ];
  }

  // --- Public API ---

  async getWarehouseShipments(warehouseId?: string, status?: string): Promise<Shipment[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "WHSShipmentTable",
        filter: warehouseId ? `InventLocationId eq '${warehouseId}'` : undefined,
        select: "ShipmentId,InventLocationId,DeliveryAddress,ShipmentStatus,ScheduledShipDate",
      });
      if (result.success && result.data) {
        const shipments = result.data as Shipment[];
        storageService.saveShipments(shipments);
        return shipments;
      }
    }
    const shipments = this.getMockShipments(warehouseId, status);
    storageService.saveShipments(shipments);
    return shipments;
  }

  async getDeliverySchedule(startDate: string, endDate: string, warehouseId?: string): Promise<Shipment[]> {
    const shipments = await this.getWarehouseShipments(warehouseId);
    return shipments.filter(s => {
      return s.scheduledDate >= startDate && s.scheduledDate <= endDate;
    });
  }

  async checkShipmentStatus(shipmentId: string): Promise<Shipment | null> {
    const allShipments = await this.getWarehouseShipments();
    return allShipments.find(s => s.shipmentId === shipmentId || s.id === shipmentId) || null;
  }

  async updateShipmentEta(shipmentId: string, newEta: string): Promise<boolean> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_update_entities", {
        entityType: "WHSShipmentTable",
        key: `ShipmentId='${shipmentId}'`,
        data: { EstimatedArrival: newEta },
      });
      if (!result.success) return false;
    } else {
      console.log(`[D365MCP] Mock: Updated ETA for ${shipmentId} to ${newEta}`);
    }

    // Sync to Dataverse
    storageService.updateShipmentByExternalId(shipmentId, {
      tiq_estimatedarrival: newEta,
    }).catch(console.error);

    return true;
  }

  async getWarehouseInventory(warehouseId: string): Promise<InventoryItem[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "InventOnHandEntity",
        filter: `InventLocationId eq '${warehouseId}'`,
        select: "ItemId,ItemName,InventLocationId,AvailPhysical,ReservedOrdered,AvailPhysicalAvailable",
      });
      if (result.success && result.data) {
        const items = result.data as InventoryItem[];
        storageService.saveInventoryItems(items);
        return items;
      }
    }
    const items = this.getMockInventory(warehouseId);
    storageService.saveInventoryItems(items);
    return items;
  }

  async getWarehouses(): Promise<Warehouse[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "InventLocationEntity",
        select: "InventLocationId,Name",
      });
      if (result.success && result.data) {
        const warehouses = result.data as Warehouse[];
        storageService.saveWarehouses(warehouses);
        return warehouses;
      }
    }
    const warehouses = this.getMockWarehouses();
    storageService.saveWarehouses(warehouses);
    return warehouses;
  }

  async updateShipmentStatus(shipmentId: string, newStatus: ShipmentStatus): Promise<boolean> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_update_entities", {
        entityType: "WHSShipmentTable",
        key: `ShipmentId='${shipmentId}'`,
        data: { ShipmentStatus: newStatus },
      });
      if (!result.success) return false;
    } else {
      console.log(`[D365MCP] Mock: Updated status for ${shipmentId} to ${newStatus}`);
    }

    // Sync to Dataverse — map status string to option set value
    const statusMap: Record<ShipmentStatus, ShipmentStatusOption> = {
      pending: ShipmentStatusOption.Pending,
      picked: ShipmentStatusOption.Picked,
      packed: ShipmentStatusOption.Packed,
      in_transit: ShipmentStatusOption.InTransit,
      delivered: ShipmentStatusOption.Delivered,
      delayed: ShipmentStatusOption.Delayed,
      cancelled: ShipmentStatusOption.Cancelled,
    };
    storageService.updateShipmentByExternalId(shipmentId, {
      tiq_status: statusMap[newStatus],
    }).catch(console.error);

    return true;
  }

  async getFleetStatus(): Promise<FleetVehicle[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "FleetVehicleEntity",
        select: "VehicleId,DriverName,Status,CurrentLocation,LoadPercent",
      });
      if (result.success && result.data) {
        const vehicles = result.data as FleetVehicle[];
        storageService.saveFleetVehicles(vehicles);
        return vehicles;
      }
    }
    const vehicles = this.getMockFleet();
    storageService.saveFleetVehicles(vehicles);
    return vehicles;
  }

  async getWorkOrders(status?: string): Promise<WorkOrder[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "msdyn_WorkOrder",
        filter: status ? `msdyn_SystemStatus eq '${status}'` : undefined,
      });
      if (result.success && result.data) {
        const workOrders = result.data as WorkOrder[];
        storageService.saveWorkOrders(workOrders);
        return status ? workOrders.filter(wo => wo.status === status) : workOrders;
      }
    }
    const all = this.getMockWorkOrders();
    const filtered = status ? all.filter(wo => wo.status === status) : all;
    storageService.saveWorkOrders(all);
    return filtered;
  }

  async getTechnicians(): Promise<Technician[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "msdyn_BookableResource",
        select: "Name,ResourceType,CurrentLocation",
      });
      if (result.success && result.data) {
        const technicians = result.data as Technician[];
        storageService.saveTechnicians(technicians);
        return technicians;
      }
    }
    const technicians = this.getMockTechnicians();
    storageService.saveTechnicians(technicians);
    return technicians;
  }

  async assignWorkOrder(workOrderId: string, technicianId: string): Promise<boolean> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_update_entities", {
        entityType: "msdyn_WorkOrder",
        key: `msdyn_WorkOrderId='${workOrderId}'`,
        data: { msdyn_PrimaryResource: technicianId, msdyn_SystemStatus: "scheduled" },
      });
      if (!result.success) return false;
    } else {
      console.log(`[D365MCP] Mock: Assigned WO ${workOrderId} to technician ${technicianId}`);
    }

    // Sync to Dataverse
    storageService.updateWorkOrderByExternalId(workOrderId, {
      tiq_status: WorkOrderStatusOption.Scheduled,
    }).catch(console.error);

    return true;
  }

  async getSupplyChainKPIs(): Promise<SupplyChainKPIs> {
    const kpis = this.getMockKPIs();
    storageService.saveSupplyChainKPIs(kpis);
    return kpis;
  }

  async getExceptionAlerts(): Promise<ExceptionAlert[]> {
    return this.getMockExceptionAlerts();
  }

  async getInventoryAlerts(): Promise<InventoryItem[]> {
    const warehouses = this.getMockWarehouses();
    const alerts: InventoryItem[] = [];
    for (const wh of warehouses) {
      const items = this.getMockInventory(wh.id);
      for (const item of items) {
        if (item.reorderPoint && item.quantityAvailable < item.reorderPoint) {
          alerts.push(item);
        }
      }
    }
    return alerts;
  }

  // --- Phase 3: Scheduling, Tracking, Maintenance, Returns ---

  async getScheduleBoard(): Promise<{ technicians: Technician[]; slots: ScheduleSlot[]; unscheduledWorkOrders: WorkOrder[] }> {
    const technicians = this.getMockTechnicians();
    const slots = this.getMockScheduleSlots();
    const allWO = this.getMockWorkOrders();
    const unscheduledWorkOrders = allWO.filter(wo => wo.status === "unscheduled");
    return { technicians, slots, unscheduledWorkOrders };
  }

  async getShipmentTracking(shipmentId: string): Promise<ShipmentTracking | null> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_find_entities", {
        entityType: "WHSShipmentTracking",
        filter: `ShipmentId eq '${shipmentId}'`,
      });
      if (result.success && result.data) return result.data as ShipmentTracking;
    }
    return this.getMockShipmentTracking(shipmentId);
  }

  async getVehicleHealth(): Promise<VehicleHealth[]> {
    const health = this.getMockVehicleHealth();
    storageService.saveVehicleHealth(health);
    return health;
  }

  async getMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
    const vehicles = this.getMockVehicleHealth();
    const alerts: MaintenanceAlert[] = [];
    for (const v of vehicles) {
      alerts.push(...v.alerts);
    }
    const sorted = alerts.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });
    storageService.saveMaintenanceAlerts(sorted);
    return sorted;
  }

  async getMaintenanceHistory(vehicleId?: string): Promise<MaintenanceRecord[]> {
    const all = this.getMockMaintenanceHistory();
    storageService.saveMaintenanceRecords(all);
    return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
  }

  async getReturns(status?: string): Promise<ReturnOrder[]> {
    const all = this.getMockReturns();
    storageService.saveReturnOrders(all);
    return status ? all.filter(r => r.status === status) : all;
  }

  async approveReturn(returnId: string): Promise<boolean> {
    if (!this.shouldUseMock()) {
      const result = await this.callMcpTool("data_update_entities", {
        entityType: "ReturnOrderTable",
        key: `ReturnId='${returnId}'`,
        data: { ReturnStatus: "approved" },
      });
      if (!result.success) return false;
    } else {
      console.log(`[D365MCP] Mock: Approved return ${returnId}`);
    }

    // Sync to Dataverse
    storageService.updateReturnOrderByExternalId(returnId, {
      tiq_status: ReturnStatusOption.Approved,
    }).catch(console.error);

    return true;
  }

  isConnected(): boolean {
    return !this.shouldUseMock();
  }
}

export const d365McpClient = new D365McpClient();
