// =============================================================================
// Data Mappers
// Convert between Dataverse entity shapes and the app's existing TypeScript types.
// This keeps the existing UI components working unchanged.
// Publisher: TrafficIQ (tiq_)
// =============================================================================

import type { TrafficIncident } from "../types/traffic";
import type { SavedJourney, Location, MorningAlertConfig } from "../types/journey";
import type { AppNotification, NotificationPreferences } from "../types/notification";

import type { TrafficIncidentEntity } from "../generated/models/TrafficIncidentModel";
import {
  IncidentTypeOption,
  SeverityOption,
  DataSourceOption,
} from "../generated/models/TrafficIncidentModel";

import type { SavedJourneyEntity } from "../generated/models/SavedJourneyModel";
import { TransportModeOption } from "../generated/models/SavedJourneyModel";

import type { NotificationEntity } from "../generated/models/NotificationModel";
import {
  NotificationTypeOption,
  NotificationSeverityOption,
} from "../generated/models/NotificationModel";

import type { UserPreferenceEntity } from "../generated/models/UserPreferenceModel";

import type { RouteOptionRecord } from "../generated/models/RouteOptionModel";
import type { RouteHistoryEntry } from "../types/history";

import type {
  Shipment,
  ShipmentItem,
  Warehouse,
  InventoryItem,
  FleetVehicle,
  WorkOrder,
  Technician,
  VehicleHealth,
  MaintenanceAlert,
  MaintenanceRecord,
  ReturnOrder,
  ReturnItem,
  SupplyChainKPIs,
} from "../types/supplychain";

import type { ShipmentEntity } from "../generated/models/ShipmentModel";
import {
  ShipmentStatusOption,
  ShipmentPriorityOption,
} from "../generated/models/ShipmentModel";

import type { WarehouseEntity } from "../generated/models/WarehouseModel";
import type { InventoryItemEntity } from "../generated/models/InventoryItemModel";

import type { FleetVehicleEntity } from "../generated/models/FleetVehicleModel";
import { VehicleStatusOption } from "../generated/models/FleetVehicleModel";

import type { WorkOrderEntity } from "../generated/models/WorkOrderModel";
import {
  WorkOrderPriorityOption,
  WorkOrderStatusOption,
} from "../generated/models/WorkOrderModel";

import type { TechnicianEntity } from "../generated/models/TechnicianModel";
import { TechnicianStatusOption } from "../generated/models/TechnicianModel";

import type { VehicleHealthEntity } from "../generated/models/VehicleHealthModel";

import type { MaintenanceAlertEntity } from "../generated/models/MaintenanceAlertModel";
import {
  MaintenanceComponentOption,
  AlertSeverityOption,
} from "../generated/models/MaintenanceAlertModel";

import type { MaintenanceRecordEntity } from "../generated/models/MaintenanceRecordModel";

import type { ReturnOrderEntity } from "../generated/models/ReturnOrderModel";
import { ReturnReasonOption, ReturnStatusOption } from "../generated/models/ReturnOrderModel";

import type { SupplyChainKPIEntity } from "../generated/models/SupplyChainKPIModel";

import type { AppSettingEntity } from "../generated/models/AppSettingModel";
import { SettingCategoryOption } from "../generated/models/AppSettingModel";
import type { AgentConfigurationEntity } from "../generated/models/AgentConfigurationModel";
import { AgentDomainOption } from "../generated/models/AgentConfigurationModel";

// =============================================================================
// JSON helper
// =============================================================================

function safeJsonParse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// =============================================================================
// Traffic Incident Mappers
// =============================================================================

const incidentTypeFromOption: Record<IncidentTypeOption, TrafficIncident["type"]> = {
  [IncidentTypeOption.Accident]: "accident",
  [IncidentTypeOption.Roadwork]: "roadwork",
  [IncidentTypeOption.Congestion]: "congestion",
  [IncidentTypeOption.Closure]: "closure",
  [IncidentTypeOption.Other]: "other",
};

const incidentTypeToOption: Record<TrafficIncident["type"], IncidentTypeOption> = {
  accident: IncidentTypeOption.Accident,
  roadwork: IncidentTypeOption.Roadwork,
  congestion: IncidentTypeOption.Congestion,
  closure: IncidentTypeOption.Closure,
  other: IncidentTypeOption.Other,
};

const severityFromOption: Record<SeverityOption, TrafficIncident["severity"]> = {
  [SeverityOption.Low]: "low",
  [SeverityOption.Medium]: "medium",
  [SeverityOption.High]: "high",
  [SeverityOption.Critical]: "critical",
};

const severityToOption: Record<TrafficIncident["severity"], SeverityOption> = {
  low: SeverityOption.Low,
  medium: SeverityOption.Medium,
  high: SeverityOption.High,
  critical: SeverityOption.Critical,
};

const sourceFromOption: Record<DataSourceOption, TrafficIncident["source"]> = {
  [DataSourceOption.Vejdirektoratet]: "vejdirektoratet",
  [DataSourceOption.AzureMaps]: "azure-maps",
  [DataSourceOption.Agent]: "agent",
};

const sourceToOption: Record<TrafficIncident["source"], DataSourceOption> = {
  vejdirektoratet: DataSourceOption.Vejdirektoratet,
  "azure-maps": DataSourceOption.AzureMaps,
  agent: DataSourceOption.Agent,
};

export function mapTrafficIncidentFromEntity(
  entity: TrafficIncidentEntity
): TrafficIncident {
  return {
    id: entity.tiq_trafficincidentid,
    type: incidentTypeFromOption[entity.tiq_incidenttype] ?? "other",
    severity: severityFromOption[entity.tiq_severity] ?? "low",
    title: entity.tiq_title,
    description: entity.tiq_description ?? "",
    location: { lat: entity.tiq_latitude, lng: entity.tiq_longitude },
    roadName: entity.tiq_roadname,
    startTime: entity.tiq_starttime,
    endTime: entity.tiq_endtime,
    delayMinutes: entity.tiq_delayminutes,
    source: sourceFromOption[entity.tiq_source] ?? "azure-maps",
  };
}

export function mapTrafficIncidentToEntity(
  incident: TrafficIncident
): Omit<TrafficIncidentEntity, "tiq_trafficincidentid"> {
  return {
    tiq_incidenttype: incidentTypeToOption[incident.type],
    tiq_severity: severityToOption[incident.severity],
    tiq_title: incident.title,
    tiq_description: incident.description,
    tiq_latitude: incident.location.lat,
    tiq_longitude: incident.location.lng,
    tiq_roadname: incident.roadName,
    tiq_starttime: incident.startTime,
    tiq_endtime: incident.endTime,
    tiq_delayminutes: incident.delayMinutes,
    tiq_source: sourceToOption[incident.source],
  };
}

// =============================================================================
// Saved Journey Mappers
// =============================================================================

const transportModeFromOption: Record<TransportModeOption, SavedJourney["preferences"]["transportMode"]> = {
  [TransportModeOption.Car]: "car",
  [TransportModeOption.Transit]: "transit",
  [TransportModeOption.Bicycle]: "bicycle",
  [TransportModeOption.Walk]: "walk",
};

const transportModeToOption: Record<SavedJourney["preferences"]["transportMode"], TransportModeOption> = {
  car: TransportModeOption.Car,
  transit: TransportModeOption.Transit,
  bicycle: TransportModeOption.Bicycle,
  walk: TransportModeOption.Walk,
};

export function mapSavedJourneyFromEntity(
  entity: SavedJourneyEntity
): SavedJourney {
  const origin: Location = {
    coordinates: { lat: entity.tiq_originlatitude, lng: entity.tiq_originlongitude },
    label: entity.tiq_originlabel,
    address: entity.tiq_originaddress,
  };

  const destination: Location = {
    coordinates: {
      lat: entity.tiq_destinationlatitude,
      lng: entity.tiq_destinationlongitude,
    },
    label: entity.tiq_destinationlabel,
    address: entity.tiq_destinationaddress,
  };

  let morningAlert: MorningAlertConfig | null = null;
  if (entity.tiq_morningalertenabled) {
    morningAlert = {
      enabled: entity.tiq_morningalertenabled,
      time: entity.tiq_morningalerttime ?? "07:00",
      daysOfWeek: entity.tiq_morningalertdays
        ? entity.tiq_morningalertdays.split(",").map(Number)
        : [1, 2, 3, 4, 5],
      emailEnabled: entity.tiq_morningalertemail ?? false,
      pushEnabled: entity.tiq_morningalertpush ?? false,
    };
  }

  return {
    id: entity.tiq_savedjourneyid,
    name: entity.tiq_name,
    origin,
    destination,
    preferences: {
      avoidTolls: entity.tiq_avoidtolls ?? false,
      avoidHighways: entity.tiq_avoidhighways ?? false,
      transportMode: transportModeFromOption[entity.tiq_transportmode] ?? "car",
    },
    morningAlert,
    createdAt: entity.createdon ?? new Date().toISOString(),
    lastUsedAt: entity.tiq_lastusedat,
  };
}

export function mapSavedJourneyToEntity(
  journey: SavedJourney
): Omit<SavedJourneyEntity, "tiq_savedjourneyid"> {
  return {
    tiq_name: journey.name,
    tiq_originlabel: journey.origin.label,
    tiq_originaddress: journey.origin.address,
    tiq_originlatitude: journey.origin.coordinates.lat,
    tiq_originlongitude: journey.origin.coordinates.lng,
    tiq_destinationlabel: journey.destination.label,
    tiq_destinationaddress: journey.destination.address,
    tiq_destinationlatitude: journey.destination.coordinates.lat,
    tiq_destinationlongitude: journey.destination.coordinates.lng,
    tiq_avoidtolls: journey.preferences.avoidTolls,
    tiq_avoidhighways: journey.preferences.avoidHighways,
    tiq_transportmode: transportModeToOption[journey.preferences.transportMode],
    tiq_morningalertenabled: journey.morningAlert?.enabled ?? false,
    tiq_morningalerttime: journey.morningAlert?.time,
    tiq_morningalertdays: journey.morningAlert?.daysOfWeek?.join(","),
    tiq_morningalertemail: journey.morningAlert?.emailEnabled ?? false,
    tiq_morningalertpush: journey.morningAlert?.pushEnabled ?? false,
    tiq_lastusedat: journey.lastUsedAt,
  };
}

// =============================================================================
// Notification Mappers
// =============================================================================

const notifTypeFromOption: Record<NotificationTypeOption, AppNotification["type"]> = {
  [NotificationTypeOption.Traffic]: "traffic",
  [NotificationTypeOption.Journey]: "journey",
  [NotificationTypeOption.System]: "system",
  [NotificationTypeOption.Shipment]: "shipment",
  [NotificationTypeOption.Fleet]: "fleet",
  [NotificationTypeOption.IoT]: "iot",
  [NotificationTypeOption.Maintenance]: "maintenance",
};

const notifTypeToOption: Record<AppNotification["type"], NotificationTypeOption> = {
  traffic: NotificationTypeOption.Traffic,
  journey: NotificationTypeOption.Journey,
  system: NotificationTypeOption.System,
  shipment: NotificationTypeOption.Shipment,
  fleet: NotificationTypeOption.Fleet,
  iot: NotificationTypeOption.IoT,
  maintenance: NotificationTypeOption.Maintenance,
};

const notifSeverityFromOption: Record<NotificationSeverityOption, NonNullable<AppNotification["severity"]>> = {
  [NotificationSeverityOption.Info]: "info",
  [NotificationSeverityOption.Warning]: "warning",
  [NotificationSeverityOption.Error]: "error",
  [NotificationSeverityOption.Success]: "success",
};

const notifSeverityToOption: Record<NonNullable<AppNotification["severity"]>, NotificationSeverityOption> = {
  info: NotificationSeverityOption.Info,
  warning: NotificationSeverityOption.Warning,
  error: NotificationSeverityOption.Error,
  success: NotificationSeverityOption.Success,
};

export function mapNotificationFromEntity(
  entity: NotificationEntity
): AppNotification {
  return {
    id: entity.tiq_notificationid,
    type: notifTypeFromOption[entity.tiq_notificationtype] ?? "system",
    title: entity.tiq_title,
    body: entity.tiq_body ?? "",
    timestamp: entity.createdon ?? new Date().toISOString(),
    read: entity.tiq_isread ?? false,
    severity: entity.tiq_severity != null
      ? notifSeverityFromOption[entity.tiq_severity]
      : undefined,
    journeyId: entity._tiq_journeyid_value,
    incidentId: entity._tiq_incidentid_value,
    shipmentId: entity._tiq_shipmentid_value,
  };
}

export function mapNotificationToEntity(
  notification: AppNotification
): Omit<NotificationEntity, "tiq_notificationid"> {
  // Note: @odata.bind lookups are intentionally omitted because the referenced
  // entities (journeys, incidents, shipments) may only exist locally (demo data)
  // and not yet in Dataverse. Including them causes 404 errors on create.
  return {
    tiq_notificationtype: notifTypeToOption[notification.type],
    tiq_title: notification.title,
    tiq_body: notification.body,
    tiq_isread: notification.read,
    tiq_severity: notification.severity
      ? notifSeverityToOption[notification.severity]
      : undefined,
  };
}

// =============================================================================
// User Preference Mappers
// =============================================================================

export function mapPreferencesFromEntity(
  entity: UserPreferenceEntity
): NotificationPreferences {
  return {
    pushEnabled: entity.tiq_pushenabled,
    emailEnabled: entity.tiq_emailenabled,
    emailAddress: entity.tiq_emailaddress,
    toastEnabled: entity.tiq_toastenabled,
    morningAlertTime: entity.tiq_morningalerttime ?? "07:00",
    morningAlertDays: entity.tiq_morningalertdays
      ? entity.tiq_morningalertdays.split(",").map(Number)
      : [1, 2, 3, 4, 5],
  };
}

export function mapPreferencesToEntity(
  prefs: NotificationPreferences
): Omit<UserPreferenceEntity, "tiq_userpreferenceid"> {
  return {
    tiq_name: "default",
    tiq_pushenabled: prefs.pushEnabled,
    tiq_emailenabled: prefs.emailEnabled,
    tiq_emailaddress: prefs.emailAddress,
    tiq_toastenabled: prefs.toastEnabled,
    tiq_morningalerttime: prefs.morningAlertTime,
    tiq_morningalertdays: prefs.morningAlertDays.join(","),
  };
}

// =============================================================================
// Route History Mappers
// =============================================================================

export function mapRouteHistoryFromEntity(
  entity: RouteOptionRecord
): RouteHistoryEntry {
  return {
    id: entity.tiq_routeoptionid ?? "",
    journeyId: entity._tiq_savedjourneyid_value,
    summary: entity.tiq_summary,
    originLabel: "",
    originLat: 0,
    originLng: 0,
    destinationLabel: "",
    destinationLat: 0,
    destinationLng: 0,
    durationMinutes: entity.tiq_durationminutes,
    durationInTrafficMinutes: entity.tiq_durationintrafficminutes ?? entity.tiq_durationminutes,
    distanceKm: entity.tiq_distancekm,
    departureTime: entity.tiq_departuretime ?? "",
    arrivalTime: entity.tiq_arrivaltime ?? "",
    trafficDelayMinutes: entity.tiq_trafficdelayminutes ?? 0,
    incidentCount: 0,
    isRecommended: entity.tiq_isrecommended ?? false,
    timestamp: entity.createdon ?? new Date().toISOString(),
  };
}

export function mapRouteHistoryToEntity(
  entry: RouteHistoryEntry
): Omit<RouteOptionRecord, "tiq_routeoptionid"> {
  return {
    tiq_summary: entry.summary,
    "tiq_savedjourneyid@odata.bind": entry.journeyId
      ? `/tiq_savedjourneys(${entry.journeyId})`
      : undefined,
    tiq_durationminutes: entry.durationMinutes,
    tiq_durationintrafficminutes: entry.durationInTrafficMinutes,
    tiq_distancekm: entry.distanceKm,
    tiq_departuretime: entry.departureTime,
    tiq_arrivaltime: entry.arrivalTime,
    tiq_trafficdelayminutes: entry.trafficDelayMinutes,
    tiq_isrecommended: entry.isRecommended,
  };
}

// =============================================================================
// Shipment Mappers
// =============================================================================

const shipmentStatusFromOption: Record<ShipmentStatusOption, Shipment["status"]> = {
  [ShipmentStatusOption.Pending]: "pending",
  [ShipmentStatusOption.Picked]: "picked",
  [ShipmentStatusOption.Packed]: "packed",
  [ShipmentStatusOption.InTransit]: "in_transit",
  [ShipmentStatusOption.Delivered]: "delivered",
  [ShipmentStatusOption.Delayed]: "delayed",
  [ShipmentStatusOption.Cancelled]: "cancelled",
};

const shipmentStatusToOption: Record<Shipment["status"], ShipmentStatusOption> = {
  pending: ShipmentStatusOption.Pending,
  picked: ShipmentStatusOption.Picked,
  packed: ShipmentStatusOption.Packed,
  in_transit: ShipmentStatusOption.InTransit,
  delivered: ShipmentStatusOption.Delivered,
  delayed: ShipmentStatusOption.Delayed,
  cancelled: ShipmentStatusOption.Cancelled,
};

const shipmentPriorityFromOption: Record<ShipmentPriorityOption, Shipment["priority"]> = {
  [ShipmentPriorityOption.Standard]: "standard",
  [ShipmentPriorityOption.Express]: "express",
  [ShipmentPriorityOption.Urgent]: "urgent",
};

const shipmentPriorityToOption: Record<Shipment["priority"], ShipmentPriorityOption> = {
  standard: ShipmentPriorityOption.Standard,
  express: ShipmentPriorityOption.Express,
  urgent: ShipmentPriorityOption.Urgent,
};

export function mapShipmentFromEntity(entity: ShipmentEntity): Shipment {
  return {
    id: entity.tiq_shipmentid ?? "",
    shipmentId: entity.tiq_shipmentid_display,
    warehouseId: entity._tiq_warehouseid_value ?? "",
    warehouseName: entity.tiq_warehousename ?? "",
    origin: {
      coordinates: {
        lat: entity.tiq_originlatitude ?? 0,
        lng: entity.tiq_originlongitude ?? 0,
      },
      label: entity.tiq_originlabel,
    },
    destination: {
      coordinates: {
        lat: entity.tiq_destinationlatitude ?? 0,
        lng: entity.tiq_destinationlongitude ?? 0,
      },
      label: entity.tiq_destinationlabel,
    },
    customerName: entity.tiq_customername ?? "",
    status: shipmentStatusFromOption[entity.tiq_status] ?? "pending",
    scheduledDate: entity.tiq_scheduleddate ?? "",
    estimatedArrival: entity.tiq_estimatedarrival,
    actualDeparture: entity.tiq_actualdeparture,
    items: safeJsonParse<ShipmentItem[]>(entity.tiq_items, []),
    totalWeight: entity.tiq_totalweight,
    currentTrafficDelay: entity.tiq_currenttrafficdelay,
    routeDistanceKm: entity.tiq_routedistancekm,
    routeDurationMinutes: entity.tiq_routedurationminutes,
    priority: shipmentPriorityFromOption[entity.tiq_priority] ?? "standard",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapShipmentToEntity(
  shipment: Shipment
): Omit<ShipmentEntity, "tiq_shipmentid"> {
  return {
    tiq_shipmentid_display: shipment.shipmentId,
    "tiq_warehouseid@odata.bind": shipment.warehouseId
      ? `/tiq_warehouses(${shipment.warehouseId})`
      : undefined,
    tiq_warehousename: shipment.warehouseName,
    tiq_originlabel: shipment.origin.label ?? "",
    tiq_originlatitude: shipment.origin.coordinates.lat,
    tiq_originlongitude: shipment.origin.coordinates.lng,
    tiq_destinationlabel: shipment.destination.label ?? "",
    tiq_destinationlatitude: shipment.destination.coordinates.lat,
    tiq_destinationlongitude: shipment.destination.coordinates.lng,
    tiq_customername: shipment.customerName,
    tiq_status: shipmentStatusToOption[shipment.status],
    tiq_priority: shipmentPriorityToOption[shipment.priority],
    tiq_scheduleddate: shipment.scheduledDate,
    tiq_estimatedarrival: shipment.estimatedArrival,
    tiq_actualdeparture: shipment.actualDeparture,
    tiq_items: JSON.stringify(shipment.items),
    tiq_totalweight: shipment.totalWeight,
    tiq_currenttrafficdelay: shipment.currentTrafficDelay,
    tiq_routedistancekm: shipment.routeDistanceKm,
    tiq_routedurationminutes: shipment.routeDurationMinutes,
    tiq_d365externalid: shipment.d365ExternalId ?? shipment.shipmentId,
  };
}

// =============================================================================
// Warehouse Mappers
// =============================================================================

export function mapWarehouseFromEntity(entity: WarehouseEntity): Warehouse {
  return {
    id: entity.tiq_warehouseid ?? "",
    name: entity.tiq_name,
    location: {
      coordinates: {
        lat: entity.tiq_latitude ?? 0,
        lng: entity.tiq_longitude ?? 0,
      },
      label: entity.tiq_name,
      address: entity.tiq_address,
    },
    activeShipments: entity.tiq_activeshipments ?? 0,
    pendingShipments: entity.tiq_pendingshipments ?? 0,
    totalInventoryItems: entity.tiq_totalinventoryitems ?? 0,
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapWarehouseToEntity(
  warehouse: Warehouse
): Omit<WarehouseEntity, "tiq_warehouseid"> {
  return {
    tiq_name: warehouse.name,
    tiq_warehousecode: warehouse.id,
    tiq_latitude: warehouse.location.coordinates.lat,
    tiq_longitude: warehouse.location.coordinates.lng,
    tiq_address: warehouse.location.address,
    tiq_activeshipments: warehouse.activeShipments,
    tiq_pendingshipments: warehouse.pendingShipments,
    tiq_totalinventoryitems: warehouse.totalInventoryItems,
    tiq_d365externalid: warehouse.d365ExternalId ?? warehouse.id,
  };
}

// =============================================================================
// Inventory Item Mappers
// =============================================================================

export function mapInventoryItemFromEntity(entity: InventoryItemEntity): InventoryItem {
  return {
    itemId: entity.tiq_inventoryitemid ?? "",
    itemName: entity.tiq_itemname,
    warehouseId: entity._tiq_warehouseid_value ?? "",
    quantityOnHand: entity.tiq_quantityonhand,
    quantityReserved: entity.tiq_quantityreserved ?? 0,
    quantityAvailable: entity.tiq_quantityavailable ?? 0,
    unit: entity.tiq_unit ?? "pcs",
    reorderPoint: entity.tiq_reorderpoint,
    lastUpdated: entity.tiq_lastupdated ?? entity.modifiedon ?? "",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapInventoryItemToEntity(
  item: InventoryItem
): Omit<InventoryItemEntity, "tiq_inventoryitemid"> {
  return {
    tiq_itemname: item.itemName,
    tiq_itemcode: item.itemId,
    "tiq_warehouseid@odata.bind": item.warehouseId
      ? `/tiq_warehouses(${item.warehouseId})`
      : undefined,
    tiq_quantityonhand: item.quantityOnHand,
    tiq_quantityreserved: item.quantityReserved,
    tiq_quantityavailable: item.quantityAvailable,
    tiq_unit: item.unit,
    tiq_reorderpoint: item.reorderPoint,
    tiq_lastupdated: item.lastUpdated,
    tiq_d365externalid: item.d365ExternalId ?? item.itemId,
  };
}

// =============================================================================
// Fleet Vehicle Mappers
// =============================================================================

const vehicleStatusFromOption: Record<VehicleStatusOption, FleetVehicle["status"]> = {
  [VehicleStatusOption.InTransit]: "in_transit",
  [VehicleStatusOption.Idle]: "idle",
  [VehicleStatusOption.Maintenance]: "maintenance",
  [VehicleStatusOption.Returning]: "returning",
};

const vehicleStatusToOption: Record<FleetVehicle["status"], VehicleStatusOption> = {
  in_transit: VehicleStatusOption.InTransit,
  idle: VehicleStatusOption.Idle,
  maintenance: VehicleStatusOption.Maintenance,
  returning: VehicleStatusOption.Returning,
};

export function mapFleetVehicleFromEntity(entity: FleetVehicleEntity): FleetVehicle {
  return {
    id: entity.tiq_fleetvehicleid ?? "",
    vehicleId: entity.tiq_vehiclecode,
    licensePlate: entity.tiq_licenseplate,
    driverName: entity.tiq_drivername ?? "",
    driverId: entity.tiq_driverid ?? "",
    status: vehicleStatusFromOption[entity.tiq_status] ?? "idle",
    currentLocation: {
      coordinates: {
        lat: entity.tiq_latitude ?? 0,
        lng: entity.tiq_longitude ?? 0,
      },
      label: entity.tiq_locationlabel ?? "",
    },
    assignedRoute: entity.tiq_assignedroute,
    currentShipmentId: entity._tiq_currentshipmentid_value,
    loadPercent: entity.tiq_loadpercent ?? 0,
    speedKmh: entity.tiq_speedkmh ?? 0,
    fuelLevelPercent: entity.tiq_fuellevelpercent ?? 0,
    hoursOnDuty: entity.tiq_hoursonduty ?? 0,
    distanceTodayKm: entity.tiq_distancetodaykm ?? 0,
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapFleetVehicleToEntity(
  vehicle: FleetVehicle
): Omit<FleetVehicleEntity, "tiq_fleetvehicleid"> {
  return {
    tiq_vehiclecode: vehicle.vehicleId,
    tiq_licenseplate: vehicle.licensePlate,
    tiq_drivername: vehicle.driverName,
    tiq_driverid: vehicle.driverId,
    tiq_status: vehicleStatusToOption[vehicle.status],
    tiq_latitude: vehicle.currentLocation.coordinates.lat,
    tiq_longitude: vehicle.currentLocation.coordinates.lng,
    tiq_locationlabel: vehicle.currentLocation.label,
    tiq_assignedroute: vehicle.assignedRoute,
    "tiq_currentshipmentid@odata.bind": vehicle.currentShipmentId
      ? `/tiq_shipments(${vehicle.currentShipmentId})`
      : undefined,
    tiq_loadpercent: vehicle.loadPercent,
    tiq_speedkmh: vehicle.speedKmh,
    tiq_fuellevelpercent: vehicle.fuelLevelPercent,
    tiq_hoursonduty: vehicle.hoursOnDuty,
    tiq_distancetodaykm: vehicle.distanceTodayKm,
    tiq_d365externalid: vehicle.d365ExternalId ?? vehicle.vehicleId,
  };
}

// =============================================================================
// Work Order Mappers
// =============================================================================

const workOrderPriorityFromOption: Record<WorkOrderPriorityOption, WorkOrder["priority"]> = {
  [WorkOrderPriorityOption.Low]: "low",
  [WorkOrderPriorityOption.Medium]: "medium",
  [WorkOrderPriorityOption.High]: "high",
  [WorkOrderPriorityOption.Critical]: "critical",
};

const workOrderPriorityToOption: Record<WorkOrder["priority"], WorkOrderPriorityOption> = {
  low: WorkOrderPriorityOption.Low,
  medium: WorkOrderPriorityOption.Medium,
  high: WorkOrderPriorityOption.High,
  critical: WorkOrderPriorityOption.Critical,
};

const workOrderStatusFromOption: Record<WorkOrderStatusOption, WorkOrder["status"]> = {
  [WorkOrderStatusOption.Unscheduled]: "unscheduled",
  [WorkOrderStatusOption.Scheduled]: "scheduled",
  [WorkOrderStatusOption.InProgress]: "in_progress",
  [WorkOrderStatusOption.Completed]: "completed",
  [WorkOrderStatusOption.Cancelled]: "cancelled",
};

const workOrderStatusToOption: Record<WorkOrder["status"], WorkOrderStatusOption> = {
  unscheduled: WorkOrderStatusOption.Unscheduled,
  scheduled: WorkOrderStatusOption.Scheduled,
  in_progress: WorkOrderStatusOption.InProgress,
  completed: WorkOrderStatusOption.Completed,
  cancelled: WorkOrderStatusOption.Cancelled,
};

export function mapWorkOrderFromEntity(entity: WorkOrderEntity): WorkOrder {
  return {
    id: entity.tiq_workorderid ?? "",
    workOrderId: entity.tiq_workorderid_display,
    customerName: entity.tiq_customername,
    serviceType: entity.tiq_servicetype,
    priority: workOrderPriorityFromOption[entity.tiq_priority] ?? "medium",
    requiredSkills: safeJsonParse<string[]>(entity.tiq_requiredskills, []),
    status: workOrderStatusFromOption[entity.tiq_status] ?? "unscheduled",
    location: {
      coordinates: {
        lat: entity.tiq_latitude ?? 0,
        lng: entity.tiq_longitude ?? 0,
      },
      label: entity.tiq_locationlabel ?? "",
    },
    estimatedDuration: entity.tiq_estimatedduration ?? 0,
    scheduledDate: entity.tiq_scheduleddate,
    assignedTechnicianId: entity._tiq_assignedtechnicianid_value,
    description: entity.tiq_description ?? "",
    createdDate: entity.tiq_createddate ?? entity.createdon ?? "",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapWorkOrderToEntity(
  workOrder: WorkOrder
): Omit<WorkOrderEntity, "tiq_workorderid"> {
  return {
    tiq_workorderid_display: workOrder.workOrderId,
    tiq_customername: workOrder.customerName,
    tiq_servicetype: workOrder.serviceType,
    tiq_priority: workOrderPriorityToOption[workOrder.priority],
    tiq_requiredskills: JSON.stringify(workOrder.requiredSkills),
    tiq_status: workOrderStatusToOption[workOrder.status],
    tiq_latitude: workOrder.location.coordinates.lat,
    tiq_longitude: workOrder.location.coordinates.lng,
    tiq_locationlabel: workOrder.location.label,
    tiq_estimatedduration: workOrder.estimatedDuration,
    tiq_scheduleddate: workOrder.scheduledDate,
    "tiq_assignedtechnicianid@odata.bind": workOrder.assignedTechnicianId
      ? `/tiq_technicians(${workOrder.assignedTechnicianId})`
      : undefined,
    tiq_description: workOrder.description,
    tiq_createddate: workOrder.createdDate,
    tiq_d365externalid: workOrder.d365ExternalId ?? workOrder.workOrderId,
  };
}

// =============================================================================
// Technician Mappers
// =============================================================================

const technicianStatusFromOption: Record<TechnicianStatusOption, Technician["status"]> = {
  [TechnicianStatusOption.Available]: "available",
  [TechnicianStatusOption.OnJob]: "on_job",
  [TechnicianStatusOption.OffDuty]: "off_duty",
};

const technicianStatusToOption: Record<Technician["status"], TechnicianStatusOption> = {
  available: TechnicianStatusOption.Available,
  on_job: TechnicianStatusOption.OnJob,
  off_duty: TechnicianStatusOption.OffDuty,
};

export function mapTechnicianFromEntity(entity: TechnicianEntity): Technician {
  return {
    id: entity.tiq_technicianid ?? "",
    name: entity.tiq_name,
    skills: safeJsonParse<string[]>(entity.tiq_skills, []),
    status: technicianStatusFromOption[entity.tiq_status] ?? "available",
    currentLocation: {
      coordinates: {
        lat: entity.tiq_latitude ?? 0,
        lng: entity.tiq_longitude ?? 0,
      },
      label: entity.tiq_locationlabel ?? "",
    },
    todayWorkOrders: entity.tiq_todayworkorders ?? 0,
    completedToday: entity.tiq_completedtoday ?? 0,
    phone: entity.tiq_phone ?? "",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapTechnicianToEntity(
  tech: Technician
): Omit<TechnicianEntity, "tiq_technicianid"> {
  return {
    tiq_name: tech.name,
    tiq_skills: JSON.stringify(tech.skills),
    tiq_status: technicianStatusToOption[tech.status],
    tiq_latitude: tech.currentLocation.coordinates.lat,
    tiq_longitude: tech.currentLocation.coordinates.lng,
    tiq_locationlabel: tech.currentLocation.label,
    tiq_todayworkorders: tech.todayWorkOrders,
    tiq_completedtoday: tech.completedToday,
    tiq_phone: tech.phone,
    tiq_d365externalid: tech.d365ExternalId ?? tech.id,
  };
}

// =============================================================================
// Vehicle Health Mappers
// =============================================================================

export function mapVehicleHealthFromEntity(entity: VehicleHealthEntity): VehicleHealth {
  return {
    vehicleId: entity._tiq_fleetvehicleid_value ?? "",
    licensePlate: entity.tiq_name,
    healthScore: entity.tiq_healthscore,
    lastServiceDate: entity.tiq_lastservicedate ?? "",
    nextPredictedService: entity.tiq_nextpredictedservice ?? "",
    mileageKm: entity.tiq_mileagekm ?? 0,
    engineHours: entity.tiq_enginehours ?? 0,
    alerts: [], // Alerts loaded separately from MaintenanceAlert table
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapVehicleHealthToEntity(
  health: VehicleHealth
): Omit<VehicleHealthEntity, "tiq_vehiclehealthid"> {
  return {
    tiq_name: health.licensePlate,
    "tiq_fleetvehicleid@odata.bind": health.vehicleId
      ? `/tiq_fleetvehicles(${health.vehicleId})`
      : undefined,
    tiq_healthscore: health.healthScore,
    tiq_lastservicedate: health.lastServiceDate,
    tiq_nextpredictedservice: health.nextPredictedService,
    tiq_mileagekm: health.mileageKm,
    tiq_enginehours: health.engineHours,
    tiq_d365externalid: health.d365ExternalId ?? health.vehicleId,
  };
}

// =============================================================================
// Maintenance Alert Mappers
// =============================================================================

const maintenanceComponentFromOption: Record<MaintenanceComponentOption, MaintenanceAlert["component"]> = {
  [MaintenanceComponentOption.Brakes]: "brakes",
  [MaintenanceComponentOption.Oil]: "oil",
  [MaintenanceComponentOption.Tires]: "tires",
  [MaintenanceComponentOption.Battery]: "battery",
  [MaintenanceComponentOption.Transmission]: "transmission",
  [MaintenanceComponentOption.Coolant]: "coolant",
  [MaintenanceComponentOption.Filters]: "filters",
};

const maintenanceComponentToOption: Record<MaintenanceAlert["component"], MaintenanceComponentOption> = {
  brakes: MaintenanceComponentOption.Brakes,
  oil: MaintenanceComponentOption.Oil,
  tires: MaintenanceComponentOption.Tires,
  battery: MaintenanceComponentOption.Battery,
  transmission: MaintenanceComponentOption.Transmission,
  coolant: MaintenanceComponentOption.Coolant,
  filters: MaintenanceComponentOption.Filters,
};

const alertSeverityFromOption: Record<AlertSeverityOption, MaintenanceAlert["severity"]> = {
  [AlertSeverityOption.Low]: "low",
  [AlertSeverityOption.Medium]: "medium",
  [AlertSeverityOption.High]: "high",
  [AlertSeverityOption.Critical]: "critical",
};

const alertSeverityToOption: Record<MaintenanceAlert["severity"], AlertSeverityOption> = {
  low: AlertSeverityOption.Low,
  medium: AlertSeverityOption.Medium,
  high: AlertSeverityOption.High,
  critical: AlertSeverityOption.Critical,
};

export function mapMaintenanceAlertFromEntity(entity: MaintenanceAlertEntity): MaintenanceAlert {
  return {
    id: entity.tiq_maintenancealertid ?? "",
    vehicleId: entity._tiq_fleetvehicleid_value ?? "",
    component: maintenanceComponentFromOption[entity.tiq_component] ?? "brakes",
    severity: alertSeverityFromOption[entity.tiq_severity] ?? "low",
    predictedFailureDate: entity.tiq_predictedfailuredate ?? "",
    confidencePercent: entity.tiq_confidencepercent ?? 0,
    recommendedAction: entity.tiq_recommendedaction ?? "",
    estimatedCost: entity.tiq_estimatedcost ?? 0,
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapMaintenanceAlertToEntity(
  alert: MaintenanceAlert
): Omit<MaintenanceAlertEntity, "tiq_maintenancealertid"> {
  return {
    tiq_name: `${alert.component} — ${alert.severity}`,
    "tiq_fleetvehicleid@odata.bind": alert.vehicleId
      ? `/tiq_fleetvehicles(${alert.vehicleId})`
      : undefined,
    tiq_component: maintenanceComponentToOption[alert.component],
    tiq_severity: alertSeverityToOption[alert.severity],
    tiq_predictedfailuredate: alert.predictedFailureDate,
    tiq_confidencepercent: alert.confidencePercent,
    tiq_recommendedaction: alert.recommendedAction,
    tiq_estimatedcost: alert.estimatedCost,
    tiq_d365externalid: alert.d365ExternalId ?? alert.id,
  };
}

// =============================================================================
// Maintenance Record Mappers
// =============================================================================

export function mapMaintenanceRecordFromEntity(entity: MaintenanceRecordEntity): MaintenanceRecord {
  return {
    id: entity.tiq_maintenancerecordid ?? "",
    vehicleId: entity._tiq_fleetvehicleid_value ?? "",
    serviceType: entity.tiq_servicetype,
    date: entity.tiq_servicedate,
    cost: entity.tiq_cost ?? 0,
    technician: entity.tiq_technician ?? "",
    notes: entity.tiq_notes ?? "",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapMaintenanceRecordToEntity(
  record: MaintenanceRecord
): Omit<MaintenanceRecordEntity, "tiq_maintenancerecordid"> {
  return {
    tiq_name: `${record.serviceType} — ${record.date}`,
    "tiq_fleetvehicleid@odata.bind": record.vehicleId
      ? `/tiq_fleetvehicles(${record.vehicleId})`
      : undefined,
    tiq_servicetype: record.serviceType,
    tiq_servicedate: record.date,
    tiq_cost: record.cost,
    tiq_technician: record.technician,
    tiq_notes: record.notes,
    tiq_d365externalid: record.d365ExternalId ?? record.id,
  };
}

// =============================================================================
// Return Order Mappers
// =============================================================================

const returnReasonFromOption: Record<ReturnReasonOption, ReturnOrder["reason"]> = {
  [ReturnReasonOption.Damaged]: "damaged",
  [ReturnReasonOption.WrongItem]: "wrong_item",
  [ReturnReasonOption.QualityIssue]: "quality_issue",
  [ReturnReasonOption.ChangedMind]: "changed_mind",
  [ReturnReasonOption.Defective]: "defective",
  [ReturnReasonOption.Other]: "other",
};

const returnReasonToOption: Record<ReturnOrder["reason"], ReturnReasonOption> = {
  damaged: ReturnReasonOption.Damaged,
  wrong_item: ReturnReasonOption.WrongItem,
  quality_issue: ReturnReasonOption.QualityIssue,
  changed_mind: ReturnReasonOption.ChangedMind,
  defective: ReturnReasonOption.Defective,
  other: ReturnReasonOption.Other,
};

const returnStatusFromOption: Record<ReturnStatusOption, ReturnOrder["status"]> = {
  [ReturnStatusOption.Requested]: "requested",
  [ReturnStatusOption.Approved]: "approved",
  [ReturnStatusOption.PickupScheduled]: "pickup_scheduled",
  [ReturnStatusOption.InTransit]: "in_transit",
  [ReturnStatusOption.Received]: "received",
  [ReturnStatusOption.Processed]: "processed",
  [ReturnStatusOption.Rejected]: "rejected",
};

const returnStatusToOption: Record<ReturnOrder["status"], ReturnStatusOption> = {
  requested: ReturnStatusOption.Requested,
  approved: ReturnStatusOption.Approved,
  pickup_scheduled: ReturnStatusOption.PickupScheduled,
  in_transit: ReturnStatusOption.InTransit,
  received: ReturnStatusOption.Received,
  processed: ReturnStatusOption.Processed,
  rejected: ReturnStatusOption.Rejected,
};

export function mapReturnOrderFromEntity(entity: ReturnOrderEntity): ReturnOrder {
  return {
    id: entity.tiq_returnorderid ?? "",
    returnId: entity.tiq_returnid_display,
    originalShipmentId: entity._tiq_originalshipmentid_value ?? "",
    customerName: entity.tiq_customername,
    reason: returnReasonFromOption[entity.tiq_reason] ?? "other",
    status: returnStatusFromOption[entity.tiq_status] ?? "requested",
    items: safeJsonParse<ReturnItem[]>(entity.tiq_items, []),
    requestedDate: entity.tiq_requesteddate ?? "",
    pickupDate: entity.tiq_pickupdate,
    receivedDate: entity.tiq_receiveddate,
    refundAmount: entity.tiq_refundamount ?? 0,
    warehouseId: entity._tiq_warehouseid_value ?? "",
    notes: entity.tiq_notes ?? "",
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapReturnOrderToEntity(
  order: ReturnOrder
): Omit<ReturnOrderEntity, "tiq_returnorderid"> {
  return {
    tiq_returnid_display: order.returnId,
    "tiq_originalshipmentid@odata.bind": order.originalShipmentId
      ? `/tiq_shipments(${order.originalShipmentId})`
      : undefined,
    tiq_customername: order.customerName,
    tiq_reason: returnReasonToOption[order.reason],
    tiq_status: returnStatusToOption[order.status],
    tiq_items: JSON.stringify(order.items),
    tiq_requesteddate: order.requestedDate,
    tiq_pickupdate: order.pickupDate,
    tiq_receiveddate: order.receivedDate,
    tiq_refundamount: order.refundAmount,
    "tiq_warehouseid@odata.bind": order.warehouseId
      ? `/tiq_warehouses(${order.warehouseId})`
      : undefined,
    tiq_notes: order.notes,
    tiq_d365externalid: order.d365ExternalId ?? order.returnId,
  };
}

// =============================================================================
// Supply Chain KPI Mappers
// =============================================================================

export function mapKPIFromEntity(entity: SupplyChainKPIEntity): SupplyChainKPIs {
  return {
    onTimeDeliveryRate: entity.tiq_ontimedeliveryrate ?? 0,
    avgDeliveryTimeMinutes: entity.tiq_avgdeliverytimeminutes ?? 0,
    activeShipments: entity.tiq_activeshipments ?? 0,
    delayedShipments: entity.tiq_delayedshipments ?? 0,
    costPerKm: entity.tiq_costperkm ?? 0,
    slaComplianceRate: entity.tiq_slacompliancerate ?? 0,
    warehouseUtilization: entity.tiq_warehouseutilization ?? 0,
    fleetUtilization: entity.tiq_fleetutilization ?? 0,
    totalDeliveriesToday: entity.tiq_totaldeliveriestoday ?? 0,
    pendingWorkOrders: entity.tiq_pendingworkorders ?? 0,
    d365ExternalId: entity.tiq_d365externalid,
  };
}

export function mapKPIToEntity(
  kpis: SupplyChainKPIs
): Omit<SupplyChainKPIEntity, "tiq_supplychainkpiid"> {
  return {
    tiq_name: `KPI Snapshot ${new Date().toISOString()}`,
    tiq_ontimedeliveryrate: kpis.onTimeDeliveryRate,
    tiq_avgdeliverytimeminutes: kpis.avgDeliveryTimeMinutes,
    tiq_activeshipments: kpis.activeShipments,
    tiq_delayedshipments: kpis.delayedShipments,
    tiq_costperkm: kpis.costPerKm,
    tiq_slacompliancerate: kpis.slaComplianceRate,
    tiq_warehouseutilization: kpis.warehouseUtilization,
    tiq_fleetutilization: kpis.fleetUtilization,
    tiq_totaldeliveriestoday: kpis.totalDeliveriesToday,
    tiq_pendingworkorders: kpis.pendingWorkOrders,
    tiq_snapshottime: new Date().toISOString(),
    tiq_d365externalid: kpis.d365ExternalId ?? `KPI-${new Date().toISOString()}`,
  };
}

// =============================================================================
// App Setting Mappers (key-value store: one row per setting category)
// =============================================================================

export { SettingCategoryOption };

/** Parse the JSON value from a Dataverse AppSettingEntity row. */
export function mapAppSettingFromEntity<T>(entity: AppSettingEntity, fallback: T): T {
  return safeJsonParse<T>(entity.tiq_value, fallback);
}

/**
 * Build a Dataverse AppSettingEntity from a settings key/value pair.
 */
export function mapAppSettingToEntity(
  key: string,
  value: unknown,
  category: SettingCategoryOption,
  displayName: string,
): Omit<AppSettingEntity, "tiq_appsettingid"> {
  return {
    tiq_key: key,
    tiq_value: JSON.stringify(value),
    tiq_category: category,
    tiq_displayname: displayName,
    tiq_isactive: true,
    tiq_issecret: false,
  };
}

// =============================================================================
// Agent Configuration Mappers (per-agent rows in tiq_agentconfigurations)
// =============================================================================

export const agentDomainToOption: Record<string, AgentDomainOption> = {
  traffic: AgentDomainOption.Traffic,
  supplychain: AgentDomainOption.SupplyChain,
  fleet: AgentDomainOption.Fleet,
  operations: AgentDomainOption.Operations,
  fieldservice: AgentDomainOption.FieldService,
  iotlogistics: AgentDomainOption.IoTLogistics,
};

const agentDomainFromOption: Record<AgentDomainOption, string> = {
  [AgentDomainOption.Traffic]: "traffic",
  [AgentDomainOption.SupplyChain]: "supplychain",
  [AgentDomainOption.Fleet]: "fleet",
  [AgentDomainOption.Operations]: "operations",
  [AgentDomainOption.FieldService]: "fieldservice",
  [AgentDomainOption.IoTLogistics]: "iotlogistics",
};

/**
 * Convert a Dataverse AgentConfigurationEntity row into a partial local shape.
 */
export function mapAgentConfigFromEntity(entity: AgentConfigurationEntity): {
  domain: string;
  isEnabled: boolean;
  modelDeployment: string;
  keywords: string[];
  sortOrder: number;
} {
  return {
    domain: agentDomainFromOption[entity.tiq_domain] ?? "traffic",
    isEnabled: entity.tiq_isenabled ?? true,
    modelDeployment: entity.tiq_modeldeployment ?? "",
    keywords: safeJsonParse<string[]>(entity.tiq_keywords, []),
    sortOrder: entity.tiq_sortorder ?? 0,
  };
}

/**
 * Convert local agent settings for a single domain to a Dataverse entity.
 */
export function mapAgentConfigToEntity(
  domain: string,
  displayName: string,
  isEnabled: boolean,
  modelDeployment: string,
  keywords: string[],
  sortOrder: number,
  color?: string,
  subtitle?: string,
): Omit<AgentConfigurationEntity, "tiq_agentconfigurationid"> {
  return {
    tiq_name: displayName,
    tiq_domain: agentDomainToOption[domain] ?? AgentDomainOption.Traffic,
    tiq_isenabled: isEnabled,
    tiq_modeldeployment: modelDeployment || undefined,
    tiq_keywords: JSON.stringify(keywords),
    tiq_sortorder: sortOrder,
    tiq_color: color,
    tiq_subtitle: subtitle,
  };
}
