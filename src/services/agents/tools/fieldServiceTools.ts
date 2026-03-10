import type { OpenAIToolDefinition } from "../../agentTools";
import { d365McpClient } from "../../d365McpClient";
import { isDemoModeEnabled } from "../../demoMode";
import { env } from "../../../config/env";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback } from "./sharedTools";

// --- Mock data for Field Service entities ---

interface ServiceRequest {
  id: string;
  title: string;
  customerName: string;
  customerSiteId: string;
  customerAddress: string;
  assetId: string;
  assetName: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "new" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
  serviceType: string;
  description: string;
  slaDeadline: string;
  slaStatus: "on_track" | "at_risk" | "breached";
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  createdAt: string;
  location: { lat: number; lng: number };
}

interface CustomerAsset {
  id: string;
  customerId: string;
  customerName: string;
  assetName: string;
  model: string;
  serialNumber: string;
  location: string;
  warrantyExpiry: string;
  warrantyStatus: "active" | "expired" | "expiring_soon";
  lastServiceDate: string;
  serviceCount: number;
  healthScore: number;
  status: "operational" | "degraded" | "down";
}

interface ServiceAgreement {
  id: string;
  customerName: string;
  contractType: "premium" | "standard" | "basic";
  startDate: string;
  endDate: string;
  responseTimeSlaHours: number;
  resolutionTimeSlaHours: number;
  coverageHours: string;
  assetsCount: number;
  monthlyVisitsIncluded: number;
  status: "active" | "expiring" | "expired";
}

interface FieldServiceMetrics {
  firstFixRate: number;
  meanResponseTimeHours: number;
  meanResolutionTimeHours: number;
  slaCompliancePercent: number;
  openRequests: number;
  completedToday: number;
  technicianUtilization: number;
  customerSatisfaction: number;
  partsAvailabilityPercent: number;
  avgTravelTimeMinutes: number;
}

// --- Mock data generators ---

function getMockServiceRequests(): ServiceRequest[] {
  const now = new Date();
  return [
    { id: "SR-2026-001", title: "HVAC Unit Not Cooling", customerName: "Nordisk Logistics A/S", customerSiteId: "CUST-NL-01", customerAddress: "Amagerbrogade 42, 2300 Copenhagen", assetId: "ASSET-HVAC-001", assetName: "Carrier 50XC Rooftop Unit", priority: "critical", status: "new", serviceType: "Repair", description: "Main HVAC unit in warehouse not cooling. Cold storage at risk.", slaDeadline: new Date(now.getTime() + 4 * 3600000).toISOString(), slaStatus: "at_risk", assignedTechnicianId: null, assignedTechnicianName: null, createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), location: { lat: 55.6616, lng: 12.6040 } },
    { id: "SR-2026-002", title: "Conveyor Belt Alignment", customerName: "Dansk Transport Group", customerSiteId: "CUST-DT-01", customerAddress: "Industriholmen 15, 2650 Hvidovre", assetId: "ASSET-CONV-003", assetName: "Hytrol EZLogic Conveyor", priority: "high", status: "assigned", serviceType: "Maintenance", description: "Conveyor belt misaligned — causing package jams.", slaDeadline: new Date(now.getTime() + 8 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-001", assignedTechnicianName: "Lars Nielsen", createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(), location: { lat: 55.6340, lng: 12.4700 } },
    { id: "SR-2026-003", title: "Loading Dock Door Malfunction", customerName: "Mærsk Warehousing", customerSiteId: "CUST-MW-01", customerAddress: "Containervej 8, 2150 Nordhavn", assetId: "ASSET-DOCK-002", assetName: "Assa Abloy Megadoor", priority: "high", status: "in_progress", serviceType: "Repair", description: "Loading dock door #3 stuck half-open. Security and weather risk.", slaDeadline: new Date(now.getTime() + 2 * 3600000).toISOString(), slaStatus: "at_risk", assignedTechnicianId: "TECH-003", assignedTechnicianName: "Erik Andersen", createdAt: new Date(now.getTime() - 6 * 3600000).toISOString(), location: { lat: 55.7080, lng: 12.5920 } },
    { id: "SR-2026-004", title: "Forklift Annual Inspection", customerName: "Nordisk Logistics A/S", customerSiteId: "CUST-NL-02", customerAddress: "Prøvestenen 28, 2300 Copenhagen", assetId: "ASSET-FORK-005", assetName: "Toyota 8FBE15 Electric Forklift", priority: "medium", status: "new", serviceType: "Inspection", description: "Annual safety inspection due. Certificate expires next week.", slaDeadline: new Date(now.getTime() + 48 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: null, assignedTechnicianName: null, createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(), location: { lat: 55.6650, lng: 12.6200 } },
    { id: "SR-2026-005", title: "Scales Calibration", customerName: "Scandinavian Fresh Foods", customerSiteId: "CUST-SF-01", customerAddress: "Grønttorvet 4, 2500 Valby", assetId: "ASSET-SCALE-001", assetName: "Mettler Toledo ICS685 Floor Scale", priority: "low", status: "completed", serviceType: "Calibration", description: "Quarterly calibration of warehouse floor scales.", slaDeadline: new Date(now.getTime() - 2 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-002", assignedTechnicianName: "Maria Jensen", createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(), location: { lat: 55.6580, lng: 12.5100 } },
    { id: "SR-2026-006", title: "Pallet Wrapping Machine Error", customerName: "Dansk Transport Group", customerSiteId: "CUST-DT-02", customerAddress: "Kystvejen 52, 8000 Aarhus", assetId: "ASSET-WRAP-001", assetName: "Robopac Genesis Futura Wrapper", priority: "medium", status: "assigned", serviceType: "Repair", description: "Error code E47 — film tension sensor malfunction.", slaDeadline: new Date(now.getTime() + 12 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-004", assignedTechnicianName: "Anders Christensen", createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(), location: { lat: 56.1500, lng: 10.2100 } },
    { id: "SR-2026-007", title: "Fire Alarm Panel Fault", customerName: "Zealand Health Solutions", customerSiteId: "CUST-ZH-01", customerAddress: "Ringstedvej 65, 4000 Roskilde", assetId: "ASSET-FIRE-001", assetName: "Siemens Cerberus Panel", priority: "critical", status: "new", serviceType: "Emergency Repair", description: "Fire alarm panel reporting communication fault on loop 2. Building evacuation protocol may trigger.", slaDeadline: new Date(now.getTime() + 2 * 3600000).toISOString(), slaStatus: "at_risk", assignedTechnicianId: null, assignedTechnicianName: null, createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(), location: { lat: 55.642, lng: 12.080 } },
    { id: "SR-2026-008", title: "Crane Hydraulic Leak", customerName: "West Coast Shipping ApS", customerSiteId: "CUST-WC-01", customerAddress: "Havnegade 3, 6700 Esbjerg", assetId: "ASSET-CRANE-001", assetName: "Liebherr LHM 420", priority: "high", status: "in_progress", serviceType: "Repair", description: "Hydraulic fluid leak detected on main boom cylinder. Crane taken out of service.", slaDeadline: new Date(now.getTime() + 6 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-006", assignedTechnicianName: "Nikolaj Svendsen", createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(), location: { lat: 55.476, lng: 8.459 } },
    { id: "SR-2026-009", title: "Server Room AC Failure", customerName: "Midtjylland Fashion Group", customerSiteId: "CUST-MF-01", customerAddress: "Tekstilvej 12, 7400 Herning", assetId: "ASSET-AC-002", assetName: "Daikin VRV IV", priority: "critical", status: "assigned", serviceType: "Emergency Repair", description: "Server room temperature rising — AC unit showing compressor error. Risk of server shutdown.", slaDeadline: new Date(now.getTime() + 3 * 3600000).toISOString(), slaStatus: "at_risk", assignedTechnicianId: "TECH-008", assignedTechnicianName: "Christian Kjær", createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), location: { lat: 56.137, lng: 8.977 } },
    { id: "SR-2026-010", title: "Emergency Exit Light Replacement", customerName: "Jutland Express A/S", customerSiteId: "CUST-JE-01", customerAddress: "Industriparken 8, 7000 Fredericia", assetId: "ASSET-LIGHT-001", assetName: "Schneider OVA Emergency Lighting", priority: "low", status: "completed", serviceType: "Maintenance", description: "Scheduled replacement of battery packs in emergency exit lighting system.", slaDeadline: new Date(now.getTime() - 4 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-007", assignedTechnicianName: "Line Frederiksen", createdAt: new Date(now.getTime() - 72 * 3600000).toISOString(), location: { lat: 55.566, lng: 9.752 } },
    { id: "SR-2026-011", title: "Conveyor Motor Overheating", customerName: "Nordisk Logistics A/S", customerSiteId: "CUST-NL-01", customerAddress: "Amagerbrogade 42, 2300 Copenhagen", assetId: "ASSET-MOTOR-001", assetName: "SEW-EURODRIVE DRN Series", priority: "high", status: "new", serviceType: "Repair", description: "Main conveyor drive motor running hot — thermal cutout triggered twice today.", slaDeadline: new Date(now.getTime() + 8 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: null, assignedTechnicianName: null, createdAt: new Date(now.getTime() - 1.5 * 3600000).toISOString(), location: { lat: 55.6616, lng: 12.6040 } },
    { id: "SR-2026-012", title: "Solar Inverter Error Code", customerName: "Dansk Transport Group", customerSiteId: "CUST-DT-03", customerAddress: "Energivej 20, 5500 Middelfart", assetId: "ASSET-SOLAR-001", assetName: "SMA Sunny Tripower 25000TL", priority: "medium", status: "assigned", serviceType: "Diagnostics", description: "Inverter displaying error code 3501 — grid frequency deviation. Solar generation offline.", slaDeadline: new Date(now.getTime() + 24 * 3600000).toISOString(), slaStatus: "on_track", assignedTechnicianId: "TECH-008", assignedTechnicianName: "Christian Kjær", createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(), location: { lat: 55.505, lng: 9.730 } },
  ];
}

function getMockCustomerAssets(): CustomerAsset[] {
  return [
    { id: "ASSET-HVAC-001", customerId: "CUST-NL", customerName: "Nordisk Logistics A/S", assetName: "Carrier 50XC Rooftop Unit", model: "50XC-24", serialNumber: "CRR-2022-94821", location: "Amagerbrogade 42, Copenhagen", warrantyExpiry: "2025-12-31", warrantyStatus: "expired", lastServiceDate: "2025-11-15", serviceCount: 8, healthScore: 42, status: "down" },
    { id: "ASSET-CONV-003", customerId: "CUST-DT", customerName: "Dansk Transport Group", assetName: "Hytrol EZLogic Conveyor", model: "EZ-2400", serialNumber: "HYT-2023-13567", location: "Industriholmen 15, Hvidovre", warrantyExpiry: "2027-06-30", warrantyStatus: "active", lastServiceDate: "2026-01-10", serviceCount: 3, healthScore: 68, status: "degraded" },
    { id: "ASSET-DOCK-002", customerId: "CUST-MW", customerName: "Mærsk Warehousing", assetName: "Assa Abloy Megadoor", model: "MD-8000", serialNumber: "AA-2021-77432", location: "Containervej 8, Nordhavn", warrantyExpiry: "2026-03-31", warrantyStatus: "expiring_soon", lastServiceDate: "2025-09-20", serviceCount: 5, healthScore: 55, status: "down" },
    { id: "ASSET-FORK-005", customerId: "CUST-NL", customerName: "Nordisk Logistics A/S", assetName: "Toyota 8FBE15 Electric Forklift", model: "8FBE15", serialNumber: "TYT-2024-05891", location: "Prøvestenen 28, Copenhagen", warrantyExpiry: "2028-02-28", warrantyStatus: "active", lastServiceDate: "2025-08-01", serviceCount: 2, healthScore: 88, status: "operational" },
    { id: "ASSET-SCALE-001", customerId: "CUST-SF", customerName: "Scandinavian Fresh Foods", assetName: "Mettler Toledo ICS685 Floor Scale", model: "ICS685-600", serialNumber: "MT-2023-33109", location: "Grønttorvet 4, Valby", warrantyExpiry: "2027-01-15", warrantyStatus: "active", lastServiceDate: "2026-02-25", serviceCount: 4, healthScore: 92, status: "operational" },
    { id: "ASSET-WRAP-001", customerId: "CUST-DT", customerName: "Dansk Transport Group", assetName: "Robopac Genesis Futura Wrapper", model: "GF-25", serialNumber: "RP-2024-12890", location: "Kystvejen 52, Aarhus", warrantyExpiry: "2028-06-30", warrantyStatus: "active", lastServiceDate: "2026-01-20", serviceCount: 1, healthScore: 71, status: "degraded" },
    { id: "ASSET-FIRE-001", customerId: "CUST-ZH", customerName: "Zealand Health Solutions", assetName: "Siemens Cerberus Fire Panel", model: "FC726", serialNumber: "SIE-2023-44201", location: "Ringstedvej 65, Roskilde", warrantyExpiry: "2028-01-31", warrantyStatus: "active", lastServiceDate: "2025-12-10", serviceCount: 3, healthScore: 38, status: "down" },
    { id: "ASSET-CRANE-001", customerId: "CUST-WC", customerName: "West Coast Shipping ApS", assetName: "Liebherr LHM 420 Mobile Harbor Crane", model: "LHM-420", serialNumber: "LH-2022-88412", location: "Havnegade 3, Esbjerg", warrantyExpiry: "2026-06-30", warrantyStatus: "expiring_soon", lastServiceDate: "2026-01-05", serviceCount: 6, healthScore: 62, status: "degraded" },
    { id: "ASSET-AC-002", customerId: "CUST-MF", customerName: "Midtjylland Fashion Group", assetName: "Daikin VRV IV Heat Pump", model: "RXYQ20T", serialNumber: "DK-2024-27693", location: "Tekstilvej 12, Herning", warrantyExpiry: "2028-09-30", warrantyStatus: "active", lastServiceDate: "2026-02-01", serviceCount: 2, healthScore: 45, status: "down" },
    { id: "ASSET-LIGHT-001", customerId: "CUST-JE", customerName: "Jutland Express A/S", assetName: "Schneider OVA Emergency Lighting System", model: "OVA38352", serialNumber: "SE-2025-11084", location: "Industriparken 8, Fredericia", warrantyExpiry: "2029-03-31", warrantyStatus: "active", lastServiceDate: "2026-02-28", serviceCount: 1, healthScore: 85, status: "operational" },
    { id: "ASSET-MOTOR-001", customerId: "CUST-NL", customerName: "Nordisk Logistics A/S", assetName: "SEW-EURODRIVE DRN Drive Motor", model: "DRN132M4", serialNumber: "SEW-2023-56290", location: "Amagerbrogade 42, Copenhagen", warrantyExpiry: "2027-11-30", warrantyStatus: "active", lastServiceDate: "2025-10-15", serviceCount: 4, healthScore: 52, status: "degraded" },
    { id: "ASSET-SOLAR-001", customerId: "CUST-DT", customerName: "Dansk Transport Group", assetName: "SMA Sunny Tripower Inverter", model: "STP25000TL-30", serialNumber: "SMA-2024-73012", location: "Energivej 20, Middelfart", warrantyExpiry: "2029-06-30", warrantyStatus: "active", lastServiceDate: "2026-01-25", serviceCount: 2, healthScore: 78, status: "operational" },
  ];
}

function getMockServiceAgreements(): ServiceAgreement[] {
  return [
    { id: "SLA-001", customerName: "Nordisk Logistics A/S", contractType: "premium", startDate: "2025-01-01", endDate: "2027-12-31", responseTimeSlaHours: 4, resolutionTimeSlaHours: 24, coverageHours: "24/7", assetsCount: 12, monthlyVisitsIncluded: 4, status: "active" },
    { id: "SLA-002", customerName: "Dansk Transport Group", contractType: "standard", startDate: "2025-06-01", endDate: "2026-05-31", responseTimeSlaHours: 8, resolutionTimeSlaHours: 48, coverageHours: "Mon-Fri 07-19", assetsCount: 8, monthlyVisitsIncluded: 2, status: "expiring" },
    { id: "SLA-003", customerName: "Mærsk Warehousing", contractType: "premium", startDate: "2024-04-01", endDate: "2027-03-31", responseTimeSlaHours: 2, resolutionTimeSlaHours: 12, coverageHours: "24/7", assetsCount: 22, monthlyVisitsIncluded: 8, status: "active" },
    { id: "SLA-004", customerName: "Scandinavian Fresh Foods", contractType: "basic", startDate: "2025-09-01", endDate: "2026-08-31", responseTimeSlaHours: 24, resolutionTimeSlaHours: 72, coverageHours: "Mon-Fri 08-17", assetsCount: 5, monthlyVisitsIncluded: 1, status: "active" },
    { id: "SLA-005", customerName: "Zealand Health Solutions", contractType: "premium", startDate: "2025-03-01", endDate: "2028-02-28", responseTimeSlaHours: 2, resolutionTimeSlaHours: 8, coverageHours: "24/7", assetsCount: 6, monthlyVisitsIncluded: 6, status: "active" },
    { id: "SLA-006", customerName: "West Coast Shipping ApS", contractType: "standard", startDate: "2025-07-01", endDate: "2026-06-30", responseTimeSlaHours: 8, resolutionTimeSlaHours: 36, coverageHours: "Mon-Sat 06-22", assetsCount: 4, monthlyVisitsIncluded: 2, status: "active" },
    { id: "SLA-007", customerName: "Jutland Express A/S", contractType: "basic", startDate: "2025-04-01", endDate: "2026-03-31", responseTimeSlaHours: 24, resolutionTimeSlaHours: 72, coverageHours: "Mon-Fri 08-17", assetsCount: 3, monthlyVisitsIncluded: 1, status: "expiring" },
  ];
}

function getMockFieldServiceMetrics(): FieldServiceMetrics {
  return {
    firstFixRate: 78.5,
    meanResponseTimeHours: 3.2,
    meanResolutionTimeHours: 14.8,
    slaCompliancePercent: 91.3,
    openRequests: 4,
    completedToday: 3,
    technicianUtilization: 82,
    customerSatisfaction: 4.3,
    partsAvailabilityPercent: 94,
    avgTravelTimeMinutes: 38,
  };
}

const fieldServicePartsInventory = [
  { partId: "PART-001", name: "HVAC Compressor Relay", category: "HVAC", quantityInField: 6, quantityInWarehouse: 12, unitCost: 245, technicianStockIds: ["TECH-001", "TECH-003"] },
  { partId: "PART-002", name: "Conveyor Belt Section (2.4m)", category: "Conveyors", quantityInField: 3, quantityInWarehouse: 8, unitCost: 890, technicianStockIds: ["TECH-001"] },
  { partId: "PART-003", name: "Door Motor Assembly", category: "Dock Equipment", quantityInField: 2, quantityInWarehouse: 4, unitCost: 1650, technicianStockIds: ["TECH-003"] },
  { partId: "PART-004", name: "Scale Load Cell Sensor", category: "Weighing", quantityInField: 4, quantityInWarehouse: 10, unitCost: 320, technicianStockIds: ["TECH-002"] },
  { partId: "PART-005", name: "Film Tension Sensor Board", category: "Wrapping", quantityInField: 2, quantityInWarehouse: 6, unitCost: 185, technicianStockIds: ["TECH-004"] },
  { partId: "PART-006", name: "Hydraulic Cylinder Seal Kit", category: "Forklifts", quantityInField: 8, quantityInWarehouse: 20, unitCost: 75, technicianStockIds: ["TECH-001", "TECH-002"] },
  { partId: "PART-007", name: "PLC Communication Module", category: "Controls", quantityInField: 3, quantityInWarehouse: 5, unitCost: 520, technicianStockIds: ["TECH-003", "TECH-004"] },
  { partId: "PART-008", name: "Refrigerant R-410A (5kg)", category: "HVAC", quantityInField: 4, quantityInWarehouse: 15, unitCost: 110, technicianStockIds: ["TECH-001", "TECH-003"] },
  { partId: "PART-009", name: "Fire Panel Communication Card", category: "Fire Systems", quantityInField: 2, quantityInWarehouse: 8, unitCost: 680, technicianStockIds: ["TECH-007"] },
  { partId: "PART-010", name: "Crane Hydraulic Cylinder Seal", category: "Cranes", quantityInField: 4, quantityInWarehouse: 12, unitCost: 420, technicianStockIds: ["TECH-006"] },
  { partId: "PART-011", name: "VRV Compressor Relay Board", category: "HVAC", quantityInField: 2, quantityInWarehouse: 5, unitCost: 890, technicianStockIds: ["TECH-001", "TECH-008"] },
  { partId: "PART-012", name: "Emergency Light Battery Pack", category: "Lighting", quantityInField: 10, quantityInWarehouse: 30, unitCost: 45, technicianStockIds: ["TECH-007", "TECH-003"] },
  { partId: "PART-013", name: "Drive Motor Bearing Set", category: "Motors", quantityInField: 3, quantityInWarehouse: 10, unitCost: 195, technicianStockIds: ["TECH-001", "TECH-006"] },
  { partId: "PART-014", name: "Solar Inverter IGBT Module", category: "Solar", quantityInField: 1, quantityInWarehouse: 4, unitCost: 1250, technicianStockIds: ["TECH-008"] },
];

// --- Tool Definitions ---

const fieldServiceOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_service_requests",
      description: "Get active field service requests with customer, asset, priority, and SLA status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["new", "assigned", "in_progress", "on_hold", "completed", "cancelled"], description: "Filter by service request status" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Filter by priority level" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_assets",
      description: "Get customer equipment and assets that require field servicing. Shows warranty, health, and service history.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Optional customer ID to filter assets (e.g. 'CUST-NL')" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_service_agreements",
      description: "Get service level agreements (SLAs) with response and resolution time guarantees.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Optional customer name to filter agreements" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_technician",
      description: "Dispatch the best-matched technician to a service request based on skills, proximity, and availability. Includes route ETA.",
      parameters: {
        type: "object",
        properties: {
          service_request_id: { type: "string", description: "The service request ID (e.g. 'SR-2026-001')" },
        },
        required: ["service_request_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_service_visit",
      description: "Mark a service request as completed with resolution notes and parts used.",
      parameters: {
        type: "object",
        properties: {
          service_request_id: { type: "string", description: "The service request ID to complete" },
          resolution_notes: { type: "string", description: "Description of what was done to resolve the issue" },
          parts_used: { type: "array", items: { type: "string" }, description: "Array of part IDs used during the service visit" },
        },
        required: ["service_request_id", "resolution_notes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_field_parts_inventory",
      description: "Get parts and spares inventory available across field service vehicles and the central warehouse.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Optional category filter (HVAC, Conveyors, Dock Equipment, Weighing, Wrapping, Forklifts, Controls)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_field_service_metrics",
      description: "Get field service operational KPIs: first-fix rate, SLA compliance, mean response/resolution time, technician utilization.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const fieldServiceToolDefinitions: OpenAIToolDefinition[] = [
  ...fieldServiceOnlyTools,
  ...sharedToolDefinitions,
];

// --- Tool Handlers ---

function handleGetServiceRequests(args: { status?: string; priority?: string }): unknown {
  if (!isDemoModeEnabled()) return { requests: [], totalCount: 0, criticalCount: 0, unassignedCount: 0, atRiskSlaCount: 0, dataSource: "D365 Field Service", note: "Demo mode is disabled — connect Dataverse MCP for live data" };
  let requests = getMockServiceRequests();
  if (args.status) requests = requests.filter(r => r.status === args.status);
  if (args.priority) requests = requests.filter(r => r.priority === args.priority);

  return {
    requests: requests.map(r => ({
      id: r.id, title: r.title, customerName: r.customerName, customerAddress: r.customerAddress,
      assetName: r.assetName, priority: r.priority, status: r.status, serviceType: r.serviceType,
      description: r.description, slaDeadline: r.slaDeadline, slaStatus: r.slaStatus,
      assignedTechnician: r.assignedTechnicianName || "Unassigned", createdAt: r.createdAt,
    })),
    totalCount: requests.length,
    criticalCount: requests.filter(r => r.priority === "critical").length,
    unassignedCount: requests.filter(r => !r.assignedTechnicianId).length,
    atRiskSlaCount: requests.filter(r => r.slaStatus === "at_risk" || r.slaStatus === "breached").length,
    dataSource: "D365 Field Service",
  };
}

function handleGetCustomerAssets(args: { customer_id?: string }): unknown {
  if (!isDemoModeEnabled()) return { assets: [], totalCount: 0, downCount: 0, degradedCount: 0, expiredWarrantyCount: 0, dataSource: "D365 Field Service", note: "Demo mode is disabled — connect Dataverse MCP for live data" };
  let assets = getMockCustomerAssets();
  if (args.customer_id) assets = assets.filter(a => a.customerId === args.customer_id);

  return {
    assets: assets.map(a => ({
      id: a.id, customerName: a.customerName, assetName: a.assetName, model: a.model,
      serialNumber: a.serialNumber, location: a.location, warrantyStatus: a.warrantyStatus,
      warrantyExpiry: a.warrantyExpiry, lastServiceDate: a.lastServiceDate,
      serviceCount: a.serviceCount, healthScore: a.healthScore, status: a.status,
    })),
    totalCount: assets.length,
    downCount: assets.filter(a => a.status === "down").length,
    degradedCount: assets.filter(a => a.status === "degraded").length,
    expiredWarrantyCount: assets.filter(a => a.warrantyStatus === "expired").length,
    dataSource: "D365 Field Service",
  };
}

function handleGetServiceAgreements(args: { customer_name?: string }): unknown {
  if (!isDemoModeEnabled()) return { agreements: [], totalCount: 0, expiringCount: 0, dataSource: "D365 Field Service", note: "Demo mode is disabled — connect Dataverse MCP for live data" };
  let agreements = getMockServiceAgreements();
  if (args.customer_name) agreements = agreements.filter(a => a.customerName.toLowerCase().includes(args.customer_name!.toLowerCase()));

  return {
    agreements: agreements.map(a => ({
      id: a.id, customerName: a.customerName, contractType: a.contractType,
      startDate: a.startDate, endDate: a.endDate, responseTimeSlaHours: a.responseTimeSlaHours,
      resolutionTimeSlaHours: a.resolutionTimeSlaHours, coverageHours: a.coverageHours,
      assetsCount: a.assetsCount, monthlyVisitsIncluded: a.monthlyVisitsIncluded, status: a.status,
    })),
    totalCount: agreements.length,
    expiringCount: agreements.filter(a => a.status === "expiring").length,
    dataSource: "D365 Field Service",
  };
}

async function handleDispatchTechnician(args: { service_request_id: string }): Promise<unknown> {
  const requests = getMockServiceRequests();
  const request = requests.find(r => r.id === args.service_request_id);
  if (!request) return { success: false, error: `Service request not found: ${args.service_request_id}` };
  if (request.status === "completed" || request.status === "cancelled") return { success: false, error: `Service request ${args.service_request_id} is already ${request.status}` };

  // Get available technicians from d365McpClient
  const technicians = await d365McpClient.getTechnicians();
  const available = technicians.filter(t => t.status === "available" || t.status === "on_job");
  if (available.length === 0) return { success: false, error: "No available technicians" };

  // Score technicians by proximity (simple distance) and availability
  const scored = available.map(t => {
    const dlat = t.currentLocation.coordinates.lat - request.location.lat;
    const dlng = t.currentLocation.coordinates.lng - request.location.lng;
    const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // rough km
    const availabilityBonus = t.status === "available" ? 20 : 0;
    const score = Math.round(100 - distance * 5 + availabilityBonus);
    return { ...t, distance: Math.round(distance * 10) / 10, score: Math.max(0, score) };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  // Calculate ETA using Azure Maps
  let etaMinutes = Math.round(best.distance * 2.5); // rough estimate
  try {
    const key = env.azureMapsKey;
    const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${best.currentLocation.coordinates.lat},${best.currentLocation.coordinates.lng}:${request.location.lat},${request.location.lng}&travelMode=car&traffic=true&routeType=fastest`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (route) {
        etaMinutes = Math.round((route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds) / 60);
      }
    }
  } catch { /* use rough estimate */ }

  return {
    success: true,
    dispatch: {
      serviceRequestId: request.id,
      title: request.title,
      customerName: request.customerName,
      customerAddress: request.customerAddress,
      technicianId: best.id,
      technicianName: best.name,
      technicianSkills: best.skills,
      distanceKm: best.distance,
      etaMinutes,
      matchScore: best.score,
    },
    message: `Dispatched ${best.name} to ${request.customerName}. ETA: ${etaMinutes} minutes.`,
    alternatives: scored.slice(1, 3).map(t => ({ id: t.id, name: t.name, distanceKm: t.distance, score: t.score })),
  };
}

function handleCompleteServiceVisit(args: { service_request_id: string; resolution_notes: string; parts_used?: string[] }): unknown {
  const requests = getMockServiceRequests();
  const request = requests.find(r => r.id === args.service_request_id);
  if (!request) return { success: false, error: `Service request not found: ${args.service_request_id}` };

  const partsUsed = (args.parts_used || []).map(pid => {
    const part = fieldServicePartsInventory.find(p => p.partId === pid);
    return { partId: pid, name: part?.name || pid, unitCost: part?.unitCost || 0 };
  });
  const totalPartsCost = partsUsed.reduce((s, p) => s + p.unitCost, 0);

  return {
    success: true,
    completion: {
      serviceRequestId: request.id,
      title: request.title,
      customerName: request.customerName,
      previousStatus: request.status,
      newStatus: "completed",
      resolutionNotes: args.resolution_notes,
      partsUsed,
      totalPartsCost,
      completedAt: new Date().toISOString(),
      slaStatus: request.slaStatus === "breached" ? "breached" : "met",
    },
    message: `Service request ${request.id} completed. ${partsUsed.length} parts used (${totalPartsCost} DKK).`,
  };
}

function handleGetFieldPartsInventory(args: { category?: string }): unknown {
  if (!isDemoModeEnabled()) return { parts: [], totalParts: 0, totalFieldStock: 0, totalWarehouseStock: 0, totalValue: 0, dataSource: "D365 Field Service", note: "Demo mode is disabled — connect Dataverse MCP for live data" };
  let parts = fieldServicePartsInventory;
  if (args.category) parts = parts.filter(p => p.category.toLowerCase() === args.category!.toLowerCase());

  return {
    parts: parts.map(p => ({
      partId: p.partId, name: p.name, category: p.category,
      inField: p.quantityInField, inWarehouse: p.quantityInWarehouse,
      totalAvailable: p.quantityInField + p.quantityInWarehouse,
      unitCost: p.unitCost, onTechVehicles: p.technicianStockIds.length,
    })),
    totalParts: parts.length,
    totalFieldStock: parts.reduce((s, p) => s + p.quantityInField, 0),
    totalWarehouseStock: parts.reduce((s, p) => s + p.quantityInWarehouse, 0),
    totalValue: parts.reduce((s, p) => s + (p.quantityInField + p.quantityInWarehouse) * p.unitCost, 0),
    dataSource: "D365 Field Service",
  };
}

function handleGetFieldServiceMetrics(): unknown {
  if (!isDemoModeEnabled()) return { metrics: {}, summary: { openRequests: 0, completedToday: 0 }, dataSource: "D365 Field Service", note: "Demo mode is disabled — connect Dataverse MCP for live data" };
  const metrics = getMockFieldServiceMetrics();
  return {
    metrics: {
      firstFixRate: { value: metrics.firstFixRate, unit: "%", target: 80, status: metrics.firstFixRate >= 80 ? "green" : metrics.firstFixRate >= 70 ? "amber" : "red" },
      meanResponseTime: { value: metrics.meanResponseTimeHours, unit: "hours", target: 4, status: metrics.meanResponseTimeHours <= 4 ? "green" : metrics.meanResponseTimeHours <= 8 ? "amber" : "red" },
      meanResolutionTime: { value: metrics.meanResolutionTimeHours, unit: "hours", target: 24, status: metrics.meanResolutionTimeHours <= 24 ? "green" : metrics.meanResolutionTimeHours <= 48 ? "amber" : "red" },
      slaCompliance: { value: metrics.slaCompliancePercent, unit: "%", target: 95, status: metrics.slaCompliancePercent >= 95 ? "green" : metrics.slaCompliancePercent >= 85 ? "amber" : "red" },
      technicianUtilization: { value: metrics.technicianUtilization, unit: "%", target: 85, status: metrics.technicianUtilization >= 85 ? "green" : metrics.technicianUtilization >= 70 ? "amber" : "red" },
      customerSatisfaction: { value: metrics.customerSatisfaction, unit: "/5", target: 4.5, status: metrics.customerSatisfaction >= 4.5 ? "green" : metrics.customerSatisfaction >= 3.5 ? "amber" : "red" },
      partsAvailability: { value: metrics.partsAvailabilityPercent, unit: "%", target: 95, status: metrics.partsAvailabilityPercent >= 95 ? "green" : metrics.partsAvailabilityPercent >= 85 ? "amber" : "red" },
      avgTravelTime: { value: metrics.avgTravelTimeMinutes, unit: "min", target: 30, status: metrics.avgTravelTimeMinutes <= 30 ? "green" : metrics.avgTravelTimeMinutes <= 45 ? "amber" : "red" },
    },
    summary: { openRequests: metrics.openRequests, completedToday: metrics.completedToday },
    generatedAt: new Date().toISOString(),
    dataSource: "D365 Field Service",
  };
}

// --- Unified tool executor ---

// --- Auto-navigation: map tool names to the page they should open ---
const TOOL_PAGE_MAP: Record<string, string> = {
  get_service_requests: "/work-orders",
  dispatch_technician: "/scheduling",
  get_service_agreements: "/work-orders",
  get_field_service_metrics: "/analytics",
};

export async function executeFieldServiceTool(name: string, argsJson: string): Promise<string> {
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;
  switch (name) {
    case "get_service_requests": result = handleGetServiceRequests(args); break;
    case "get_customer_assets": result = handleGetCustomerAssets(args); break;
    case "get_service_agreements": result = handleGetServiceAgreements(args); break;
    case "dispatch_technician": result = await handleDispatchTechnician(args); break;
    case "complete_service_visit": result = handleCompleteServiceVisit(args); break;
    case "get_field_parts_inventory": result = handleGetFieldPartsInventory(args); break;
    case "get_field_service_metrics": result = handleGetFieldServiceMetrics(); break;
    default: result = { error: `Unknown field service tool: ${name}` };
  }
  // Auto-navigate to the relevant page
  const targetPage = TOOL_PAGE_MAP[name];
  if (targetPage) {
    const nav = getNavigateCallback();
    if (nav) nav(targetPage);
  }
  return JSON.stringify(result);
}
