import type { SavedJourney } from "../types/journey";
import type {
  NotificationPreferences,
  AppNotification,
} from "../types/notification";
import type { RouteHistoryEntry } from "../types/history";
import type { TrafficIncident } from "../types/traffic";
import type { AgentSettings } from "../types/settings";
import type {
  Shipment,
  Warehouse,
  InventoryItem,
  FleetVehicle,
  WorkOrder,
  Technician,
  VehicleHealth,
  MaintenanceAlert,
  MaintenanceRecord,
  ReturnOrder,
  SupplyChainKPIs,
} from "../types/supplychain";
import { STORAGE_KEYS } from "../utils/constants";
import { SavedJourneyService } from "../generated/services/SavedJourneyService";
import { NotificationDataService } from "../generated/services/NotificationDataService";
import { UserPreferenceService } from "../generated/services/UserPreferenceService";
import { RouteHistoryService } from "../generated/services/RouteHistoryService";
import { ShipmentService } from "../generated/services/ShipmentService";
import { WarehouseService } from "../generated/services/WarehouseService";
import { InventoryItemService } from "../generated/services/InventoryItemService";
import { FleetVehicleService } from "../generated/services/FleetVehicleService";
import { WorkOrderService } from "../generated/services/WorkOrderService";
import { TechnicianService } from "../generated/services/TechnicianService";
import { VehicleHealthService } from "../generated/services/VehicleHealthService";
import { MaintenanceAlertService } from "../generated/services/MaintenanceAlertService";
import { MaintenanceRecordService } from "../generated/services/MaintenanceRecordService";
import { ReturnOrderService } from "../generated/services/ReturnOrderService";
import { SupplyChainKPIService } from "../generated/services/SupplyChainKPIService";
import { TrafficIncidentService } from "../generated/services/TrafficIncidentService";
import { AppSettingService } from "../generated/services/AppSettingService";
import { AgentConfigurationService } from "../generated/services/AgentConfigurationService";
import {
  mapSavedJourneyFromEntity,
  mapSavedJourneyToEntity,
  mapNotificationFromEntity,
  mapNotificationToEntity,
  mapPreferencesFromEntity,
  mapPreferencesToEntity,
  mapRouteHistoryFromEntity,
  mapRouteHistoryToEntity,
  mapShipmentFromEntity,
  mapShipmentToEntity,
  mapWarehouseFromEntity,
  mapWarehouseToEntity,
  mapInventoryItemFromEntity,
  mapInventoryItemToEntity,
  mapFleetVehicleFromEntity,
  mapFleetVehicleToEntity,
  mapWorkOrderFromEntity,
  mapWorkOrderToEntity,
  mapTechnicianFromEntity,
  mapTechnicianToEntity,
  mapVehicleHealthFromEntity,
  mapVehicleHealthToEntity,
  mapMaintenanceAlertFromEntity,
  mapMaintenanceAlertToEntity,
  mapMaintenanceRecordFromEntity,
  mapMaintenanceRecordToEntity,
  mapReturnOrderFromEntity,
  mapReturnOrderToEntity,
  mapKPIFromEntity,
  mapKPIToEntity,
  mapTrafficIncidentFromEntity,
  mapTrafficIncidentToEntity,
  mapAppSettingToEntity,
  mapAgentConfigFromEntity,
  mapAgentConfigToEntity,
  agentDomainToOption,
  SettingCategoryOption,
} from "./dataMappers";
import { DataverseClient } from "./dataverseClient";

const MAX_NOTIFICATIONS = 100;
const MAX_ROUTE_HISTORY = 500;

class StorageService {
  // ---------------------------------------------------------------------------
  // Local storage helpers (fallback & cache)
  // ---------------------------------------------------------------------------

  private getLocal<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ---------------------------------------------------------------------------
  // Saved Journeys — synced to Dataverse tiq_savedjourney table
  // ---------------------------------------------------------------------------

  getSavedJourneys(): SavedJourney[] {
    return this.getLocal<SavedJourney[]>(STORAGE_KEYS.SAVED_JOURNEYS, []);
  }

  saveJourney(journey: SavedJourney): void {
    // Update local cache immediately for responsive UI
    const journeys = this.getSavedJourneys();
    const existingIndex = journeys.findIndex((j) => j.id === journey.id);
    if (existingIndex >= 0) {
      journeys[existingIndex] = journey;
    } else {
      journeys.push(journey);
    }
    this.setLocal(STORAGE_KEYS.SAVED_JOURNEYS, journeys);

    // Sync to Dataverse in the background
    if (DataverseClient.isConnected) {
      const entity = mapSavedJourneyToEntity(journey);
      if (existingIndex >= 0) {
        SavedJourneyService.update(journey.id, entity).catch(console.error);
      } else {
        SavedJourneyService.create(entity).catch(console.error);
      }
    }
  }

  deleteJourney(id: string): void {
    // Update local cache immediately
    const journeys = this.getSavedJourneys().filter((j) => j.id !== id);
    this.setLocal(STORAGE_KEYS.SAVED_JOURNEYS, journeys);

    // Sync to Dataverse
    if (DataverseClient.isConnected) {
      SavedJourneyService.delete(id).catch(console.error);
    }
  }

  /**
   * Sync saved journeys from Dataverse to local cache.
   * Call on app startup when connected to Power Platform.
   */
  async syncJourneysFromDataverse(): Promise<SavedJourney[]> {
    if (!DataverseClient.isConnected) return this.getSavedJourneys();

    try {
      const result = await SavedJourneyService.getAll({
        orderBy: ["createdon desc"],
      });
      if (result.data) {
        const journeys = result.data.map(mapSavedJourneyFromEntity);
        this.setLocal(STORAGE_KEYS.SAVED_JOURNEYS, journeys);
        return journeys;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync journeys:", err);
    }
    return this.getSavedJourneys();
  }

  // ---------------------------------------------------------------------------
  // Notification Preferences — synced to Dataverse tiq_userpreference table
  // ---------------------------------------------------------------------------

  getNotificationPreferences(): NotificationPreferences {
    return this.getLocal<NotificationPreferences>(
      STORAGE_KEYS.NOTIFICATION_PREFS,
      {
        pushEnabled: false,
        emailEnabled: false,
        toastEnabled: true,
        morningAlertTime: "07:00",
        morningAlertDays: [1, 2, 3, 4, 5],
      }
    );
  }

  saveNotificationPreferences(prefs: NotificationPreferences): void {
    // Update local cache immediately
    this.setLocal(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);

    // Sync to Dataverse
    if (DataverseClient.isConnected) {
      const entity = mapPreferencesToEntity(prefs);
      UserPreferenceService.getAll({ top: 1 })
        .then(async (result) => {
          if (result.data?.length) {
            const existingId = result.data[0].tiq_userpreferenceid;
            await UserPreferenceService.update(existingId, entity);
          } else {
            await UserPreferenceService.create(entity);
          }
        })
        .catch(console.error);
    }
  }

  /**
   * Sync notification preferences from Dataverse to local cache.
   */
  async syncPreferencesFromDataverse(): Promise<NotificationPreferences> {
    if (!DataverseClient.isConnected) return this.getNotificationPreferences();

    try {
      const result = await UserPreferenceService.getAll({ top: 1 });
      if (result.data?.length) {
        const prefs = mapPreferencesFromEntity(result.data[0]);
        this.setLocal(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);
        return prefs;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync preferences:", err);
    }
    return this.getNotificationPreferences();
  }

  // ---------------------------------------------------------------------------
  // Notification Log — synced to Dataverse tiq_notification table
  // ---------------------------------------------------------------------------

  getNotifications(): AppNotification[] {
    return this.getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATION_LOG, []);
  }

  addNotification(notification: AppNotification): void {
    // Update local cache
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    this.setLocal(STORAGE_KEYS.NOTIFICATION_LOG, trimmed);

    // Sync to Dataverse
    if (DataverseClient.isConnected) {
      const entity = mapNotificationToEntity(notification);
      NotificationDataService.create(entity).catch(console.error);
    }
  }

  markNotificationRead(id: string): void {
    // Update local cache
    const notifications = this.getNotifications();
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.setLocal(STORAGE_KEYS.NOTIFICATION_LOG, notifications);
    }

    // Sync to Dataverse
    if (DataverseClient.isConnected) {
      NotificationDataService.update(id, { tiq_isread: true }).catch(
        console.error
      );
    }
  }

  /**
   * Sync notifications from Dataverse to local cache.
   */
  async syncNotificationsFromDataverse(): Promise<AppNotification[]> {
    if (!DataverseClient.isConnected) return this.getNotifications();

    try {
      const result = await NotificationDataService.getAll({
        top: MAX_NOTIFICATIONS,
        orderBy: ["createdon desc"],
      });
      if (result.data) {
        const notifications = result.data.map(mapNotificationFromEntity);
        this.setLocal(STORAGE_KEYS.NOTIFICATION_LOG, notifications);
        return notifications;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync notifications:", err);
    }
    return this.getNotifications();
  }

  // ---------------------------------------------------------------------------
  // Route History — synced to Dataverse tiq_routeoption table
  // ---------------------------------------------------------------------------

  getRouteHistory(journeyId?: string): RouteHistoryEntry[] {
    const all = this.getLocal<RouteHistoryEntry[]>(STORAGE_KEYS.ROUTE_HISTORY, []);
    if (journeyId) return all.filter((e) => e.journeyId === journeyId);
    return all;
  }

  addRouteHistoryEntry(entry: RouteHistoryEntry): void {
    const history = this.getRouteHistory();
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_ROUTE_HISTORY);
    this.setLocal(STORAGE_KEYS.ROUTE_HISTORY, trimmed);

    if (DataverseClient.isConnected) {
      const entity = mapRouteHistoryToEntity(entry);
      RouteHistoryService.create(entity).catch(console.error);
    }
  }

  async syncRouteHistoryFromDataverse(): Promise<RouteHistoryEntry[]> {
    if (!DataverseClient.isConnected) return this.getRouteHistory();

    try {
      const result = await RouteHistoryService.getAll({
        top: MAX_ROUTE_HISTORY,
        orderBy: ["createdon desc"],
      });
      if (result.data) {
        const history = result.data.map(mapRouteHistoryFromEntity);
        this.setLocal(STORAGE_KEYS.ROUTE_HISTORY, history);
        return history;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync route history:", err);
    }
    return this.getRouteHistory();
  }

  // ---------------------------------------------------------------------------
  // Shipments — synced to Dataverse tiq_shipment table
  // ---------------------------------------------------------------------------

  getShipments(): Shipment[] {
    return this.getLocal<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  }

  saveShipments(data: Shipment[]): void {
    this.setLocal(STORAGE_KEYS.SHIPMENTS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapShipmentToEntity(item);
        const extId = item.d365ExternalId ?? item.shipmentId;
        ShipmentService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncShipmentsFromDataverse(): Promise<Shipment[]> {
    if (!DataverseClient.isConnected) return this.getShipments();
    try {
      const result = await ShipmentService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapShipmentFromEntity);
        this.setLocal(STORAGE_KEYS.SHIPMENTS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync shipments:", err);
    }
    return this.getShipments();
  }

  // ---------------------------------------------------------------------------
  // Warehouses — synced to Dataverse tiq_warehouse table
  // ---------------------------------------------------------------------------

  getWarehouses(): Warehouse[] {
    return this.getLocal<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
  }

  saveWarehouses(data: Warehouse[]): void {
    this.setLocal(STORAGE_KEYS.WAREHOUSES, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapWarehouseToEntity(item);
        const extId = item.d365ExternalId ?? item.id;
        WarehouseService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncWarehousesFromDataverse(): Promise<Warehouse[]> {
    if (!DataverseClient.isConnected) return this.getWarehouses();
    try {
      const result = await WarehouseService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapWarehouseFromEntity);
        this.setLocal(STORAGE_KEYS.WAREHOUSES, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync warehouses:", err);
    }
    return this.getWarehouses();
  }

  // ---------------------------------------------------------------------------
  // Inventory Items — synced to Dataverse tiq_inventoryitem table
  // ---------------------------------------------------------------------------

  getInventoryItems(warehouseId?: string): InventoryItem[] {
    const all = this.getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY_ITEMS, []);
    if (warehouseId) return all.filter((i) => i.warehouseId === warehouseId);
    return all;
  }

  saveInventoryItems(data: InventoryItem[]): void {
    this.setLocal(STORAGE_KEYS.INVENTORY_ITEMS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapInventoryItemToEntity(item);
        const extId = item.d365ExternalId ?? item.itemId;
        InventoryItemService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncInventoryFromDataverse(): Promise<InventoryItem[]> {
    if (!DataverseClient.isConnected) return this.getInventoryItems();
    try {
      const result = await InventoryItemService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapInventoryItemFromEntity);
        this.setLocal(STORAGE_KEYS.INVENTORY_ITEMS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync inventory:", err);
    }
    return this.getInventoryItems();
  }

  // ---------------------------------------------------------------------------
  // Fleet Vehicles — synced to Dataverse tiq_fleetvehicle table
  // ---------------------------------------------------------------------------

  getFleetVehicles(): FleetVehicle[] {
    return this.getLocal<FleetVehicle[]>(STORAGE_KEYS.FLEET_VEHICLES, []);
  }

  saveFleetVehicles(data: FleetVehicle[]): void {
    this.setLocal(STORAGE_KEYS.FLEET_VEHICLES, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapFleetVehicleToEntity(item);
        const extId = item.d365ExternalId ?? item.vehicleId;
        FleetVehicleService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncFleetFromDataverse(): Promise<FleetVehicle[]> {
    if (!DataverseClient.isConnected) return this.getFleetVehicles();
    try {
      const result = await FleetVehicleService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapFleetVehicleFromEntity);
        this.setLocal(STORAGE_KEYS.FLEET_VEHICLES, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync fleet:", err);
    }
    return this.getFleetVehicles();
  }

  // ---------------------------------------------------------------------------
  // Work Orders — synced to Dataverse tiq_workorder table
  // ---------------------------------------------------------------------------

  getWorkOrders(status?: string): WorkOrder[] {
    const all = this.getLocal<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []);
    if (status) return all.filter((wo) => wo.status === status);
    return all;
  }

  saveWorkOrders(data: WorkOrder[]): void {
    this.setLocal(STORAGE_KEYS.WORK_ORDERS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapWorkOrderToEntity(item);
        const extId = item.d365ExternalId ?? item.workOrderId;
        WorkOrderService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncWorkOrdersFromDataverse(): Promise<WorkOrder[]> {
    if (!DataverseClient.isConnected) return this.getWorkOrders();
    try {
      const result = await WorkOrderService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapWorkOrderFromEntity);
        this.setLocal(STORAGE_KEYS.WORK_ORDERS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync work orders:", err);
    }
    return this.getWorkOrders();
  }

  // ---------------------------------------------------------------------------
  // Technicians — synced to Dataverse tiq_technician table
  // ---------------------------------------------------------------------------

  getTechnicians(): Technician[] {
    return this.getLocal<Technician[]>(STORAGE_KEYS.TECHNICIANS, []);
  }

  saveTechnicians(data: Technician[]): void {
    this.setLocal(STORAGE_KEYS.TECHNICIANS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapTechnicianToEntity(item);
        const extId = item.d365ExternalId ?? item.id;
        TechnicianService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncTechniciansFromDataverse(): Promise<Technician[]> {
    if (!DataverseClient.isConnected) return this.getTechnicians();
    try {
      const result = await TechnicianService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapTechnicianFromEntity);
        this.setLocal(STORAGE_KEYS.TECHNICIANS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync technicians:", err);
    }
    return this.getTechnicians();
  }

  // ---------------------------------------------------------------------------
  // Vehicle Health — synced to Dataverse tiq_vehiclehealth table
  // ---------------------------------------------------------------------------

  getVehicleHealth(): VehicleHealth[] {
    return this.getLocal<VehicleHealth[]>(STORAGE_KEYS.VEHICLE_HEALTH, []);
  }

  saveVehicleHealth(data: VehicleHealth[]): void {
    this.setLocal(STORAGE_KEYS.VEHICLE_HEALTH, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapVehicleHealthToEntity(item);
        const extId = item.d365ExternalId ?? item.vehicleId;
        VehicleHealthService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncVehicleHealthFromDataverse(): Promise<VehicleHealth[]> {
    if (!DataverseClient.isConnected) return this.getVehicleHealth();
    try {
      const result = await VehicleHealthService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapVehicleHealthFromEntity);
        this.setLocal(STORAGE_KEYS.VEHICLE_HEALTH, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync vehicle health:", err);
    }
    return this.getVehicleHealth();
  }

  // ---------------------------------------------------------------------------
  // Maintenance Alerts — synced to Dataverse tiq_maintenancealert table
  // ---------------------------------------------------------------------------

  getMaintenanceAlerts(): MaintenanceAlert[] {
    return this.getLocal<MaintenanceAlert[]>(STORAGE_KEYS.MAINTENANCE_ALERTS, []);
  }

  saveMaintenanceAlerts(data: MaintenanceAlert[]): void {
    this.setLocal(STORAGE_KEYS.MAINTENANCE_ALERTS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapMaintenanceAlertToEntity(item);
        const extId = item.d365ExternalId ?? item.id;
        MaintenanceAlertService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncMaintenanceAlertsFromDataverse(): Promise<MaintenanceAlert[]> {
    if (!DataverseClient.isConnected) return this.getMaintenanceAlerts();
    try {
      const result = await MaintenanceAlertService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapMaintenanceAlertFromEntity);
        this.setLocal(STORAGE_KEYS.MAINTENANCE_ALERTS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync maintenance alerts:", err);
    }
    return this.getMaintenanceAlerts();
  }

  // ---------------------------------------------------------------------------
  // Maintenance Records — synced to Dataverse tiq_maintenancerecord table
  // ---------------------------------------------------------------------------

  getMaintenanceRecords(vehicleId?: string): MaintenanceRecord[] {
    const all = this.getLocal<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE_RECORDS, []);
    if (vehicleId) return all.filter((r) => r.vehicleId === vehicleId);
    return all;
  }

  saveMaintenanceRecords(data: MaintenanceRecord[]): void {
    this.setLocal(STORAGE_KEYS.MAINTENANCE_RECORDS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapMaintenanceRecordToEntity(item);
        const extId = item.d365ExternalId ?? item.id;
        MaintenanceRecordService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncMaintenanceRecordsFromDataverse(): Promise<MaintenanceRecord[]> {
    if (!DataverseClient.isConnected) return this.getMaintenanceRecords();
    try {
      const result = await MaintenanceRecordService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapMaintenanceRecordFromEntity);
        this.setLocal(STORAGE_KEYS.MAINTENANCE_RECORDS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync maintenance records:", err);
    }
    return this.getMaintenanceRecords();
  }

  // ---------------------------------------------------------------------------
  // Return Orders — synced to Dataverse tiq_returnorder table
  // ---------------------------------------------------------------------------

  getReturnOrders(status?: string): ReturnOrder[] {
    const all = this.getLocal<ReturnOrder[]>(STORAGE_KEYS.RETURN_ORDERS, []);
    if (status) return all.filter((r) => r.status === status);
    return all;
  }

  saveReturnOrders(data: ReturnOrder[]): void {
    this.setLocal(STORAGE_KEYS.RETURN_ORDERS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapReturnOrderToEntity(item);
        const extId = item.d365ExternalId ?? item.returnId;
        ReturnOrderService.upsertByExternalId(extId, entity).catch(console.error);
      }
    }
  }

  async syncReturnOrdersFromDataverse(): Promise<ReturnOrder[]> {
    if (!DataverseClient.isConnected) return this.getReturnOrders();
    try {
      const result = await ReturnOrderService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapReturnOrderFromEntity);
        this.setLocal(STORAGE_KEYS.RETURN_ORDERS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync return orders:", err);
    }
    return this.getReturnOrders();
  }

  // ---------------------------------------------------------------------------
  // Supply Chain KPIs — synced to Dataverse tiq_supplychainkpi table
  // ---------------------------------------------------------------------------

  getSupplyChainKPIs(): SupplyChainKPIs | null {
    return this.getLocal<SupplyChainKPIs | null>(STORAGE_KEYS.SUPPLY_CHAIN_KPIS, null);
  }

  saveSupplyChainKPIs(data: SupplyChainKPIs): void {
    this.setLocal(STORAGE_KEYS.SUPPLY_CHAIN_KPIS, data);
    if (DataverseClient.isConnected) {
      const entity = mapKPIToEntity(data);
      const extId = data.d365ExternalId ?? `KPI-${new Date().toISOString()}`;
      SupplyChainKPIService.upsertByExternalId(extId, entity).catch(console.error);
    }
  }

  async syncKPIsFromDataverse(): Promise<SupplyChainKPIs | null> {
    if (!DataverseClient.isConnected) return this.getSupplyChainKPIs();
    try {
      const result = await SupplyChainKPIService.getAll({
        top: 1,
        orderBy: ["createdon desc"],
      });
      if (result.data?.length) {
        const kpis = mapKPIFromEntity(result.data[0]);
        this.setLocal(STORAGE_KEYS.SUPPLY_CHAIN_KPIS, kpis);
        return kpis;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync KPIs:", err);
    }
    return this.getSupplyChainKPIs();
  }

  // ---------------------------------------------------------------------------
  // Traffic Incidents — synced to Dataverse tiq_trafficincident table
  // ---------------------------------------------------------------------------

  getTrafficIncidents(): TrafficIncident[] {
    return this.getLocal<TrafficIncident[]>(STORAGE_KEYS.TRAFFIC_INCIDENTS, []);
  }

  saveTrafficIncidents(data: TrafficIncident[]): void {
    this.setLocal(STORAGE_KEYS.TRAFFIC_INCIDENTS, data);
    if (DataverseClient.isConnected) {
      for (const item of data) {
        const entity = mapTrafficIncidentToEntity(item);
        TrafficIncidentService.create(entity).catch(console.error);
      }
    }
  }

  async syncTrafficIncidentsFromDataverse(): Promise<TrafficIncident[]> {
    if (!DataverseClient.isConnected) return this.getTrafficIncidents();
    try {
      const result = await TrafficIncidentService.getAll({ orderBy: ["createdon desc"] });
      if (result.data) {
        const items = result.data.map(mapTrafficIncidentFromEntity);
        this.setLocal(STORAGE_KEYS.TRAFFIC_INCIDENTS, items);
        return items;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync traffic incidents:", err);
    }
    return this.getTrafficIncidents();
  }

  // ---------------------------------------------------------------------------
  // Partial Update Helpers (for mutation write-back from D365 MCP)
  // ---------------------------------------------------------------------------

  async updateShipmentByExternalId(externalId: string, changes: Record<string, unknown>): Promise<void> {
    if (!DataverseClient.isConnected) return;
    try {
      const dvId = await DataverseClient.findByExternalId("tiq_shipments", "tiq_d365externalid", externalId);
      if (dvId) {
        await ShipmentService.update(dvId, changes);
      }
    } catch (err) {
      console.error("[StorageService] Failed to update shipment by external ID:", err);
    }
  }

  async updateWorkOrderByExternalId(externalId: string, changes: Record<string, unknown>): Promise<void> {
    if (!DataverseClient.isConnected) return;
    try {
      const dvId = await DataverseClient.findByExternalId("tiq_workorders", "tiq_d365externalid", externalId);
      if (dvId) {
        await WorkOrderService.update(dvId, changes);
      }
    } catch (err) {
      console.error("[StorageService] Failed to update work order by external ID:", err);
    }
  }

  async updateReturnOrderByExternalId(externalId: string, changes: Record<string, unknown>): Promise<void> {
    if (!DataverseClient.isConnected) return;
    try {
      const dvId = await DataverseClient.findByExternalId("tiq_returnorders", "tiq_d365externalid", externalId);
      if (dvId) {
        await ReturnOrderService.update(dvId, changes);
      }
    } catch (err) {
      console.error("[StorageService] Failed to update return order by external ID:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // App Settings — synced to Dataverse tiq_appsetting table (key-value rows)
  // ---------------------------------------------------------------------------

  /**
   * Read a setting from localStorage.
   */
  getAppSetting<T>(storageKey: string, fallback: T): T {
    return this.getLocal<T>(storageKey, fallback);
  }

  /**
   * Save a settings value to both localStorage and Dataverse.
   * Uses upsert: filter by tiq_key, update if exists, create if not.
   */
  saveAppSetting(
    storageKey: string,
    dataverseKey: string,
    value: unknown,
    category: SettingCategoryOption,
    displayName: string,
  ): void {
    this.setLocal(storageKey, value);

    if (DataverseClient.isConnected) {
      const entity = mapAppSettingToEntity(dataverseKey, value, category, displayName);
      AppSettingService.getAll({
        filter: `tiq_key eq '${dataverseKey}'`,
        top: 1,
      })
        .then(async (result) => {
          if (result.data?.length) {
            const existingId = result.data[0].tiq_appsettingid!;
            await AppSettingService.update(existingId, entity);
          } else {
            await AppSettingService.create(entity);
          }
        })
        .catch(console.error);
    }
  }

  /**
   * Sync ALL app settings from Dataverse to localStorage in one batch.
   */
  async syncAppSettingsFromDataverse(): Promise<void> {
    if (!DataverseClient.isConnected) return;

    try {
      const result = await AppSettingService.getAll({
        filter: "tiq_isactive eq true",
      });
      if (result.data) {
        for (const entity of result.data) {
          const storageKey = this.appSettingKeyToStorageKey(entity.tiq_key);
          if (storageKey && entity.tiq_value) {
            try {
              const parsed = JSON.parse(entity.tiq_value);
              this.setLocal(storageKey, parsed);
            } catch {
              localStorage.setItem(storageKey, entity.tiq_value);
            }
          }
        }
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync app settings:", err);
    }
  }

  private appSettingKeyToStorageKey(dvKey: string): string | null {
    const map: Record<string, string> = {
      demo_mode: STORAGE_KEYS.DEMO_MODE,
      theme: STORAGE_KEYS.THEME,
      map_settings: STORAGE_KEYS.MAP_SETTINGS,
      d365_settings: STORAGE_KEYS.D365_SETTINGS,
      dataverse_settings: STORAGE_KEYS.DATAVERSE_SETTINGS,
      dataverse_mcp_settings: STORAGE_KEYS.DATAVERSE_MCP_SETTINGS,
      email_settings: STORAGE_KEYS.EMAIL_SETTINGS,
      iothub_settings: STORAGE_KEYS.IOTHUB_SETTINGS,
      agent_default_fallback: STORAGE_KEYS.AGENT_SETTINGS,
      agent_sticky_max_words: STORAGE_KEYS.AGENT_SETTINGS,
    };
    return map[dvKey] ?? null;
  }

  // --- Demo Mode ---
  saveDemoMode(enabled: boolean): void {
    this.saveAppSetting(
      STORAGE_KEYS.DEMO_MODE, "demo_mode", enabled,
      SettingCategoryOption.General, "Demo Mode",
    );
  }

  getDemoMode(): boolean {
    return this.getAppSetting<boolean>(STORAGE_KEYS.DEMO_MODE, true);
  }

  // --- Theme ---
  saveTheme(mode: string): void {
    this.saveAppSetting(
      STORAGE_KEYS.THEME, "theme", mode,
      SettingCategoryOption.General, "Theme",
    );
  }

  getTheme(): string {
    return this.getAppSetting<string>(STORAGE_KEYS.THEME, "system");
  }

  // --- Map Settings ---
  saveMapSettings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.MAP_SETTINGS, "map_settings", settings,
      SettingCategoryOption.Map, "Map Settings",
    );
  }

  // --- D365 Settings ---
  saveD365Settings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.D365_SETTINGS, "d365_settings", settings,
      SettingCategoryOption.MCP, "D365 F&O Settings",
    );
  }

  // --- Dataverse Settings ---
  saveDataverseSettings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.DATAVERSE_SETTINGS, "dataverse_settings", settings,
      SettingCategoryOption.Dataverse, "Dataverse Settings",
    );
  }

  // --- Dataverse MCP Settings ---
  saveDataverseMcpSettings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.DATAVERSE_MCP_SETTINGS, "dataverse_mcp_settings", settings,
      SettingCategoryOption.MCP, "Dataverse MCP Settings",
    );
  }

  // --- Email Settings ---
  saveEmailSettings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.EMAIL_SETTINGS, "email_settings", settings,
      SettingCategoryOption.Email, "Email Settings",
    );
  }

  // --- IoT Hub Settings ---
  saveIoTHubSettings(settings: unknown): void {
    this.saveAppSetting(
      STORAGE_KEYS.IOTHUB_SETTINGS, "iothub_settings", settings,
      SettingCategoryOption.IoTHub, "IoT Hub Settings",
    );
  }

  // ---------------------------------------------------------------------------
  // Agent Configurations — synced to Dataverse tiq_agentconfiguration table
  // ---------------------------------------------------------------------------

  getAgentSettings(fallback: AgentSettings): AgentSettings {
    return this.getLocal<AgentSettings>(STORAGE_KEYS.AGENT_SETTINGS, fallback);
  }

  saveAgentSettings(
    settings: AgentSettings,
    agentConfigs: Record<string, { displayName: string; color: string; subtitle: string }>,
  ): void {
    this.setLocal(STORAGE_KEYS.AGENT_SETTINGS, settings);

    if (DataverseClient.isConnected) {
      // Save per-domain rows to tiq_agentconfigurations
      for (const [index, domain] of settings.agentOrder.entries()) {
        const config = agentConfigs[domain];
        if (!config) continue;
        const entity = mapAgentConfigToEntity(
          domain,
          config.displayName,
          settings.enabledAgents[domain] !== false,
          settings.modelOverrides[domain] ?? "",
          settings.keywordAdditions[domain] ?? [],
          index,
          config.color,
          config.subtitle,
        );
        const domainOption = agentDomainToOption[domain];
        if (domainOption === undefined) continue;
        AgentConfigurationService.getAll({
          filter: `tiq_domain eq ${domainOption}`,
          top: 1,
        })
          .then(async (result) => {
            if (result.data?.length) {
              await AgentConfigurationService.update(
                result.data[0].tiq_agentconfigurationid!, entity,
              );
            } else {
              await AgentConfigurationService.create(entity);
            }
          })
          .catch(console.error);
      }

      // Save global routing settings as app-settings key-value rows
      this.saveAppSetting(
        STORAGE_KEYS.AGENT_SETTINGS, "agent_default_fallback", settings.defaultFallback,
        SettingCategoryOption.Agents, "Agent Default Fallback",
      );
      this.saveAppSetting(
        STORAGE_KEYS.AGENT_SETTINGS, "agent_sticky_max_words", settings.stickyMaxWords,
        SettingCategoryOption.Agents, "Agent Sticky Max Words",
      );
    }
  }

  async syncAgentSettingsFromDataverse(fallback: AgentSettings): Promise<AgentSettings> {
    if (!DataverseClient.isConnected) {
      return this.getLocal<AgentSettings>(STORAGE_KEYS.AGENT_SETTINGS, fallback);
    }

    try {
      const result = await AgentConfigurationService.getAll({
        orderBy: ["tiq_sortorder asc"],
      });
      if (result.data?.length) {
        const enabledAgents: Record<string, boolean> = { ...fallback.enabledAgents };
        const modelOverrides: Record<string, string> = {};
        const keywordAdditions: Record<string, string[]> = {};
        const agentOrder: string[] = [];

        for (const entity of result.data) {
          const mapped = mapAgentConfigFromEntity(entity);
          enabledAgents[mapped.domain] = mapped.isEnabled;
          if (mapped.modelDeployment) {
            modelOverrides[mapped.domain] = mapped.modelDeployment;
          }
          if (mapped.keywords.length) {
            keywordAdditions[mapped.domain] = mapped.keywords;
          }
          agentOrder.push(mapped.domain);
        }

        // Load global routing settings from app-settings
        let defaultFallback = fallback.defaultFallback;
        let stickyMaxWords = fallback.stickyMaxWords;
        try {
          const settingsResult = await AppSettingService.getAll({
            filter: "tiq_category eq 100480006",
          });
          if (settingsResult.data) {
            for (const s of settingsResult.data) {
              if (s.tiq_key === "agent_default_fallback" && s.tiq_value) {
                defaultFallback = JSON.parse(s.tiq_value);
              }
              if (s.tiq_key === "agent_sticky_max_words" && s.tiq_value) {
                stickyMaxWords = JSON.parse(s.tiq_value);
              }
            }
          }
        } catch {
          // use fallback values
        }

        const merged: AgentSettings = {
          enabledAgents,
          modelOverrides,
          keywordAdditions,
          agentOrder: agentOrder.length ? agentOrder : fallback.agentOrder,
          defaultFallback,
          stickyMaxWords,
        };
        this.setLocal(STORAGE_KEYS.AGENT_SETTINGS, merged);
        return merged;
      }
    } catch (err) {
      console.error("[StorageService] Failed to sync agent settings:", err);
    }
    return this.getLocal<AgentSettings>(STORAGE_KEYS.AGENT_SETTINGS, fallback);
  }
}

export const storageService = new StorageService();
