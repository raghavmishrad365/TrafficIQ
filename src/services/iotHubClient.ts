import { env } from "../config/env";
import { isDemoModeEnabled } from "./demoMode";

/**
 * Client for Azure IoT Hub.
 * Connects to IoT Hub via a backend proxy to query device twins,
 * telemetry, geofences, and driving behavior data.
 *
 * When IoT Hub is not configured, falls back to mock data for development/demo.
 */

// --- Types ---

export interface IoTDevice {
  deviceId: string;
  vehicleId: string;
  licensePlate: string;
  deviceModel: string;
  firmwareVersion: string;
  status: "online" | "offline" | "degraded";
  signalStrengthPercent: number;
  batteryLevelPercent: number;
  lastHeartbeat: string;
  lastKnownLocation: { lat: number; lng: number; label: string };
  installedDate: string;
}

export interface Geofence {
  geofenceId: string;
  name: string;
  type: "warehouse_zone";
  center: { lat: number; lng: number };
  radiusMeters: number;
  warehouseId: string;
}

export interface GeofenceAlert {
  id: string;
  geofenceId: string;
  geofenceName: string;
  vehicleId: string;
  driverName: string;
  eventType: "entry" | "exit";
  timestamp: string;
  dwellTimeMinutes: number | null;
  expectedEntry: boolean;
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface DrivingAlert {
  id: string;
  vehicleId: string;
  driverName: string;
  alertType: "speeding" | "harsh_braking" | "excessive_idling" | "route_deviation";
  severity: AlertSeverity;
  timestamp: string;
  location: { lat: number; lng: number; label: string };
  details: string;
  speedKmh: number | undefined;
  speedLimitKmh: number | undefined;
  durationSeconds: number | undefined;
}

export interface ConnectivityAlert {
  id: string;
  deviceId: string;
  vehicleId: string;
  alertType: "device_offline" | "signal_degraded" | "battery_low" | "gps_signal_lost";
  severity: AlertSeverity;
  timestamp: string;
  resolvedAt: string | null;
  durationMinutes: number | null;
  details: string;
}

// --- API result interface ---

interface IoTHubApiResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// --- Client class ---

class IoTHubClient {
  private hostname: string | null = null;
  private useMockData = true;
  private mockDeviceOverrides = new Map<string, Partial<IoTDevice>>();

  initialize() {
    this.hostname = env.iotHubHostname || null;
    this.useMockData = !this.hostname;
    if (this.useMockData) {
      console.log("[IoTHub] No IoT Hub hostname configured, using mock data");
    } else {
      console.log(`[IoTHub] Connected to ${this.hostname}`);
    }
  }

  /** Check if mock data should be used: global demo mode OR no live connection */
  private shouldUseMock(): boolean {
    return isDemoModeEnabled() || this.useMockData;
  }

  /** Call IoT Hub API via the backend proxy */
  private async callIoTHubApi(endpoint: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<IoTHubApiResult> {
    if (this.shouldUseMock()) {
      return { success: true, data: null };
    }

    try {
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`/api/iot-hub/${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, error: `IoT Hub API call failed (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "IoT Hub connection failed",
      };
    }
  }

  // --- Mock Data ---

  private getMockDevices(): IoTDevice[] {
    const base: IoTDevice[] = [
      {
        deviceId: "IOT-GPS-001", vehicleId: "TRK-101", licensePlate: "AB 12 345",
        deviceModel: "Teltonika FMC130", firmwareVersion: "3.31.2",
        status: "online", signalStrengthPercent: 92, batteryLevelPercent: 78,
        lastHeartbeat: new Date(Date.now() - 45 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.82, lng: 11.45, label: "E20 near Ringsted" },
        installedDate: "2025-06-15",
      },
      {
        deviceId: "IOT-GPS-002", vehicleId: "TRK-102", licensePlate: "CD 34 567",
        deviceModel: "Teltonika FMC130", firmwareVersion: "3.31.2",
        status: "online", signalStrengthPercent: 85, batteryLevelPercent: 45,
        lastHeartbeat: new Date(Date.now() - 30 * 1000).toISOString(),
        lastKnownLocation: { lat: 56.05, lng: 10.12, label: "E45 near Skanderborg" },
        installedDate: "2025-07-02",
      },
      {
        deviceId: "IOT-GPS-003", vehicleId: "TRK-103", licensePlate: "EF 56 789",
        deviceModel: "Queclink GV300", firmwareVersion: "5.10.1",
        status: "online", signalStrengthPercent: 98, batteryLevelPercent: 95,
        lastHeartbeat: new Date(Date.now() - 15 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.676, lng: 12.568, label: "Copenhagen Central Warehouse" },
        installedDate: "2025-05-20",
      },
      {
        deviceId: "IOT-GPS-004", vehicleId: "TRK-104", licensePlate: "GH 78 901",
        deviceModel: "Teltonika FMC130", firmwareVersion: "3.30.8",
        status: "degraded", signalStrengthPercent: 42, batteryLevelPercent: 31,
        lastHeartbeat: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.49, lng: 9.47, label: "E20 near Kolding" },
        installedDate: "2025-08-10",
      },
      {
        deviceId: "IOT-GPS-005", vehicleId: "TRK-105", licensePlate: "IJ 90 123",
        deviceModel: "Queclink GV300", firmwareVersion: "5.10.1",
        status: "offline", signalStrengthPercent: 0, batteryLevelPercent: 12,
        lastHeartbeat: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        lastKnownLocation: { lat: 56.162, lng: 10.203, label: "Aarhus Regional Warehouse" },
        installedDate: "2025-09-01",
      },
      {
        deviceId: "IOT-GPS-006", vehicleId: "VAN-201", licensePlate: "KL 12 456",
        deviceModel: "CalAmp LMU-4233", firmwareVersion: "2.8.4",
        status: "online", signalStrengthPercent: 71, batteryLevelPercent: 55,
        lastHeartbeat: new Date(Date.now() - 60 * 1000).toISOString(),
        lastKnownLocation: { lat: 56.72, lng: 9.96, label: "E45 near Hobro" },
        installedDate: "2025-10-15",
      },
      {
        deviceId: "IOT-GPS-007", vehicleId: "TRK-106", licensePlate: "MN 34 567",
        deviceModel: "Teltonika FMC130", firmwareVersion: "3.31.2",
        status: "online", signalStrengthPercent: 88, batteryLevelPercent: 72,
        lastHeartbeat: new Date(Date.now() - 25 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.48, lng: 8.46, label: "E20 near Esbjerg" },
        installedDate: "2025-11-10",
      },
      {
        deviceId: "IOT-GPS-008", vehicleId: "VAN-202", licensePlate: "OP 56 789",
        deviceModel: "CalAmp LMU-4233", firmwareVersion: "2.8.4",
        status: "online", signalStrengthPercent: 95, batteryLevelPercent: 88,
        lastHeartbeat: new Date(Date.now() - 10 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.676, lng: 12.568, label: "Copenhagen Central Warehouse" },
        installedDate: "2025-12-01",
      },
      {
        deviceId: "IOT-GPS-009", vehicleId: "TRK-107", licensePlate: "QR 78 901",
        deviceModel: "Queclink GV300", firmwareVersion: "5.10.1",
        status: "online", signalStrengthPercent: 76, batteryLevelPercent: 63,
        lastHeartbeat: new Date(Date.now() - 55 * 1000).toISOString(),
        lastKnownLocation: { lat: 55.64, lng: 12.08, label: "E47 near Roskilde" },
        installedDate: "2026-01-15",
      },
      {
        deviceId: "IOT-GPS-010", vehicleId: "VAN-203", licensePlate: "ST 90 123",
        deviceModel: "CalAmp LMU-4233", firmwareVersion: "2.8.4",
        status: "degraded", signalStrengthPercent: 35, batteryLevelPercent: 22,
        lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        lastKnownLocation: { lat: 57.048, lng: 9.921, label: "Aalborg North Terminal" },
        installedDate: "2026-02-01",
      },
    ];
    // Apply any mock overrides (from activate/deactivate or reassign)
    return base.map(d => {
      const overrides = this.mockDeviceOverrides.get(d.deviceId);
      return overrides ? { ...d, ...overrides } : d;
    });
  }

  private getMockGeofences(): Geofence[] {
    return [
      { geofenceId: "GEO-DK01", name: "Copenhagen Central Warehouse Zone", type: "warehouse_zone", center: { lat: 55.676, lng: 12.568 }, radiusMeters: 500, warehouseId: "DK01" },
      { geofenceId: "GEO-DK02", name: "Aarhus Regional Warehouse Zone", type: "warehouse_zone", center: { lat: 56.162, lng: 10.203 }, radiusMeters: 400, warehouseId: "DK02" },
      { geofenceId: "GEO-DK03", name: "Odense Distribution Zone", type: "warehouse_zone", center: { lat: 55.403, lng: 10.388 }, radiusMeters: 350, warehouseId: "DK03" },
      { geofenceId: "GEO-DK04", name: "Aalborg North Terminal Zone", type: "warehouse_zone", center: { lat: 57.048, lng: 9.921 }, radiusMeters: 400, warehouseId: "DK04" },
      { geofenceId: "GEO-ESBJ", name: "Esbjerg Port Zone", type: "warehouse_zone", center: { lat: 55.476, lng: 8.459 }, radiusMeters: 600, warehouseId: "ESBJ" },
      { geofenceId: "GEO-FRED", name: "Fredericia Hub Zone", type: "warehouse_zone", center: { lat: 55.566, lng: 9.752 }, radiusMeters: 350, warehouseId: "FRED" },
    ];
  }

  private getMockGeofenceAlerts(): GeofenceAlert[] {
    return [
      { id: "GFA-001", geofenceId: "GEO-DK01", geofenceName: "Copenhagen Central Warehouse Zone", vehicleId: "TRK-101", driverName: "Lars Nielsen", eventType: "exit", timestamp: "2026-02-28T07:15:00Z", dwellTimeMinutes: 42, expectedEntry: true },
      { id: "GFA-002", geofenceId: "GEO-DK03", geofenceName: "Odense Distribution Zone", vehicleId: "TRK-101", driverName: "Lars Nielsen", eventType: "entry", timestamp: "2026-02-28T09:30:00Z", dwellTimeMinutes: null, expectedEntry: true },
      { id: "GFA-003", geofenceId: "GEO-DK01", geofenceName: "Copenhagen Central Warehouse Zone", vehicleId: "TRK-102", driverName: "Mette Andersen", eventType: "exit", timestamp: "2026-02-28T06:45:00Z", dwellTimeMinutes: 38, expectedEntry: true },
      { id: "GFA-004", geofenceId: "GEO-DK02", geofenceName: "Aarhus Regional Warehouse Zone", vehicleId: "TRK-104", driverName: "Søren Petersen", eventType: "entry", timestamp: "2026-02-28T08:20:00Z", dwellTimeMinutes: null, expectedEntry: false },
      { id: "GFA-005", geofenceId: "GEO-DK02", geofenceName: "Aarhus Regional Warehouse Zone", vehicleId: "VAN-201", driverName: "Anne Sørensen", eventType: "exit", timestamp: "2026-02-28T07:55:00Z", dwellTimeMinutes: 25, expectedEntry: true },
      { id: "GFA-006", geofenceId: "GEO-DK01", geofenceName: "Copenhagen Central Warehouse Zone", vehicleId: "TRK-103", driverName: "Henrik Jørgensen", eventType: "entry", timestamp: "2026-02-28T05:30:00Z", dwellTimeMinutes: null, expectedEntry: true },
      { id: "GFA-007", geofenceId: "GEO-DK03", geofenceName: "Odense Distribution Zone", vehicleId: "TRK-102", driverName: "Mette Andersen", eventType: "entry", timestamp: "2026-02-28T10:05:00Z", dwellTimeMinutes: null, expectedEntry: true },
      { id: "GFA-008", geofenceId: "GEO-DK01", geofenceName: "Copenhagen Central Warehouse Zone", vehicleId: "TRK-103", driverName: "Henrik Jørgensen", eventType: "exit", timestamp: "2026-02-28T06:15:00Z", dwellTimeMinutes: 45, expectedEntry: true },
      { id: "GFA-009", geofenceId: "GEO-DK04", geofenceName: "Aalborg North Terminal Zone", vehicleId: "VAN-203", driverName: "Camilla Holm", eventType: "entry", timestamp: "2026-02-28T06:00:00Z", dwellTimeMinutes: null, expectedEntry: true },
      { id: "GFA-010", geofenceId: "GEO-ESBJ", geofenceName: "Esbjerg Port Zone", vehicleId: "TRK-106", driverName: "Christian Dam", eventType: "entry", timestamp: "2026-02-28T10:45:00Z", dwellTimeMinutes: null, expectedEntry: true },
      { id: "GFA-011", geofenceId: "GEO-ESBJ", geofenceName: "Esbjerg Port Zone", vehicleId: "TRK-106", driverName: "Christian Dam", eventType: "exit", timestamp: "2026-02-28T11:30:00Z", dwellTimeMinutes: 45, expectedEntry: true },
      { id: "GFA-012", geofenceId: "GEO-FRED", geofenceName: "Fredericia Hub Zone", vehicleId: "TRK-107", driverName: "Rasmus Møller", eventType: "entry", timestamp: "2026-02-28T08:15:00Z", dwellTimeMinutes: null, expectedEntry: false },
      { id: "GFA-013", geofenceId: "GEO-DK01", geofenceName: "Copenhagen Central Warehouse Zone", vehicleId: "VAN-202", driverName: "Louise Eriksen", eventType: "exit", timestamp: "2026-02-28T09:00:00Z", dwellTimeMinutes: 55, expectedEntry: true },
      { id: "GFA-014", geofenceId: "GEO-DK04", geofenceName: "Aalborg North Terminal Zone", vehicleId: "VAN-203", driverName: "Camilla Holm", eventType: "exit", timestamp: "2026-02-28T12:00:00Z", dwellTimeMinutes: 360, expectedEntry: true },
    ];
  }

  private getMockDrivingAlerts(): DrivingAlert[] {
    return [
      { id: "DBA-001", vehicleId: "TRK-102", driverName: "Mette Andersen", alertType: "speeding", severity: "high", timestamp: "2026-02-28T08:42:00Z", location: { lat: 56.05, lng: 10.12, label: "E45 near Skanderborg" }, details: "112 km/h in 90 km/h zone", speedKmh: 112, speedLimitKmh: 90, durationSeconds: undefined },
      { id: "DBA-002", vehicleId: "TRK-104", driverName: "Søren Petersen", alertType: "harsh_braking", severity: "medium", timestamp: "2026-02-28T09:15:00Z", location: { lat: 55.49, lng: 9.47, label: "E20 near Kolding" }, details: "Deceleration -8.2 m/s\u00B2 \u2014 possible hazard avoidance", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: undefined },
      { id: "DBA-003", vehicleId: "TRK-101", driverName: "Lars Nielsen", alertType: "excessive_idling", severity: "low", timestamp: "2026-02-28T07:48:00Z", location: { lat: 55.63, lng: 12.08, label: "Ringsted Service Area" }, details: "Idling for 18 minutes with engine running", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: 1080 },
      { id: "DBA-004", vehicleId: "VAN-201", driverName: "Anne S\u00F8rensen", alertType: "route_deviation", severity: "medium", timestamp: "2026-02-28T10:30:00Z", location: { lat: 56.46, lng: 10.05, label: "Near Randers" }, details: "4.2 km deviation from planned route E45 \u2192 secondary road", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: undefined },
      { id: "DBA-005", vehicleId: "TRK-102", driverName: "Mette Andersen", alertType: "speeding", severity: "medium", timestamp: "2026-02-28T09:55:00Z", location: { lat: 55.86, lng: 9.84, label: "E45 near Horsens" }, details: "98 km/h in 80 km/h zone", speedKmh: 98, speedLimitKmh: 80, durationSeconds: undefined },
      { id: "DBA-006", vehicleId: "TRK-104", driverName: "S\u00F8ren Petersen", alertType: "excessive_idling", severity: "medium", timestamp: "2026-02-28T11:20:00Z", location: { lat: 55.71, lng: 9.54, label: "Vejle rest stop" }, details: "Idling for 32 minutes \u2014 exceeds 15-minute threshold", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: 1920 },
      { id: "DBA-007", vehicleId: "TRK-106", driverName: "Christian Dam", alertType: "speeding", severity: "high", timestamp: "2026-02-28T11:05:00Z", location: { lat: 55.50, lng: 9.00, label: "E20 near Vejen" }, details: "118 km/h in 90 km/h zone", speedKmh: 118, speedLimitKmh: 90, durationSeconds: undefined },
      { id: "DBA-008", vehicleId: "VAN-202", driverName: "Louise Eriksen", alertType: "harsh_braking", severity: "medium", timestamp: "2026-02-28T09:22:00Z", location: { lat: 55.68, lng: 12.56, label: "Copenhagen ring road" }, details: "Deceleration -7.5 m/s\u00B2 \u2014 sudden stop at intersection", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: undefined },
      { id: "DBA-009", vehicleId: "TRK-107", driverName: "Rasmus M\u00F8ller", alertType: "route_deviation", severity: "low", timestamp: "2026-02-28T08:50:00Z", location: { lat: 55.63, lng: 11.90, label: "Near Lejre" }, details: "2.1 km deviation \u2014 likely fuel stop", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: undefined },
      { id: "DBA-010", vehicleId: "VAN-203", driverName: "Camilla Holm", alertType: "excessive_idling", severity: "high", timestamp: "2026-02-28T10:15:00Z", location: { lat: 57.05, lng: 9.92, label: "Aalborg terminal loading bay" }, details: "Idling for 48 minutes \u2014 exceeds 15-minute threshold", speedKmh: undefined, speedLimitKmh: undefined, durationSeconds: 2880 },
    ];
  }

  private getMockConnectivityAlerts(): ConnectivityAlert[] {
    return [
      { id: "CON-001", deviceId: "IOT-GPS-005", vehicleId: "TRK-105", alertType: "device_offline", severity: "critical", timestamp: "2026-02-28T09:12:00Z", resolvedAt: null, durationMinutes: null, details: "Device offline for 48+ minutes. Vehicle in maintenance bay at Aarhus warehouse." },
      { id: "CON-002", deviceId: "IOT-GPS-004", vehicleId: "TRK-104", alertType: "signal_degraded", severity: "high", timestamp: "2026-02-28T08:45:00Z", resolvedAt: null, durationMinutes: null, details: "Signal dropped to 42%. Possible antenna obstruction or hardware issue." },
      { id: "CON-003", deviceId: "IOT-GPS-005", vehicleId: "TRK-105", alertType: "battery_low", severity: "critical", timestamp: "2026-02-28T09:00:00Z", resolvedAt: null, durationMinutes: null, details: "Battery at 12%. Needs charging or replacement immediately." },
      { id: "CON-004", deviceId: "IOT-GPS-002", vehicleId: "TRK-102", alertType: "battery_low", severity: "medium", timestamp: "2026-02-28T07:30:00Z", resolvedAt: null, durationMinutes: null, details: "Battery at 45%. Schedule charging at next warehouse stop." },
      { id: "CON-005", deviceId: "IOT-GPS-004", vehicleId: "TRK-104", alertType: "gps_signal_lost", severity: "high", timestamp: "2026-02-28T08:30:00Z", resolvedAt: "2026-02-28T08:38:00Z", durationMinutes: 8, details: "GPS signal lost for 8 minutes near tunnel on E20 Kolding." },
      { id: "CON-006", deviceId: "IOT-GPS-006", vehicleId: "VAN-201", alertType: "signal_degraded", severity: "medium", timestamp: "2026-02-28T09:05:00Z", resolvedAt: "2026-02-28T09:15:00Z", durationMinutes: 10, details: "Signal dropped to 55% in rural area near Hobro. Recovered." },
      { id: "CON-007", deviceId: "IOT-GPS-010", vehicleId: "VAN-203", alertType: "battery_low", severity: "critical", timestamp: "2026-02-28T10:00:00Z", resolvedAt: null, durationMinutes: null, details: "Battery at 22%. Device at Aalborg terminal \u2014 needs immediate charging." },
      { id: "CON-008", deviceId: "IOT-GPS-007", vehicleId: "TRK-106", alertType: "gps_signal_lost", severity: "medium", timestamp: "2026-02-28T10:50:00Z", resolvedAt: "2026-02-28T10:55:00Z", durationMinutes: 5, details: "GPS signal lost for 5 minutes in Esbjerg port area \u2014 recovered." },
      { id: "CON-009", deviceId: "IOT-GPS-009", vehicleId: "TRK-107", alertType: "signal_degraded", severity: "medium", timestamp: "2026-02-28T08:40:00Z", resolvedAt: null, durationMinutes: null, details: "Signal dropped to 52% in rural area near Lejre." },
    ];
  }

  // --- Public API ---

  async getDevices(vehicleId?: string): Promise<IoTDevice[]> {
    if (!this.shouldUseMock()) {
      const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : "";
      const result = await this.callIoTHubApi(`devices${query}`);
      if (result.success && result.data) {
        return result.data as IoTDevice[];
      }
    }
    let devices = this.getMockDevices();
    if (vehicleId) devices = devices.filter(d => d.vehicleId === vehicleId);
    return devices;
  }

  async getDevice(deviceId: string): Promise<IoTDevice | null> {
    if (!this.shouldUseMock()) {
      const result = await this.callIoTHubApi(`devices/${encodeURIComponent(deviceId)}`);
      if (result.success && result.data) {
        return result.data as IoTDevice;
      }
    }
    return this.getMockDevices().find(d => d.deviceId === deviceId) || null;
  }

  async getGeofences(): Promise<Geofence[]> {
    if (!this.shouldUseMock()) {
      const result = await this.callIoTHubApi("geofences");
      if (result.success && result.data) {
        return result.data as Geofence[];
      }
    }
    return this.getMockGeofences();
  }

  async getGeofenceAlerts(filters?: { geofenceId?: string; vehicleId?: string; eventType?: string }): Promise<GeofenceAlert[]> {
    if (!this.shouldUseMock()) {
      const params = new URLSearchParams();
      if (filters?.geofenceId) params.set("geofenceId", filters.geofenceId);
      if (filters?.vehicleId) params.set("vehicleId", filters.vehicleId);
      if (filters?.eventType) params.set("eventType", filters.eventType);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await this.callIoTHubApi(`geofence-alerts${query}`);
      if (result.success && result.data) {
        return result.data as GeofenceAlert[];
      }
    }
    let alerts = this.getMockGeofenceAlerts();
    if (filters?.geofenceId) alerts = alerts.filter(a => a.geofenceId === filters.geofenceId);
    if (filters?.vehicleId) alerts = alerts.filter(a => a.vehicleId === filters.vehicleId);
    if (filters?.eventType) alerts = alerts.filter(a => a.eventType === filters.eventType);
    return alerts;
  }

  async getDrivingAlerts(filters?: { vehicleId?: string; alertType?: string }): Promise<DrivingAlert[]> {
    if (!this.shouldUseMock()) {
      const params = new URLSearchParams();
      if (filters?.vehicleId) params.set("vehicleId", filters.vehicleId);
      if (filters?.alertType) params.set("alertType", filters.alertType);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await this.callIoTHubApi(`driving-alerts${query}`);
      if (result.success && result.data) {
        return result.data as DrivingAlert[];
      }
    }
    let alerts = this.getMockDrivingAlerts();
    if (filters?.vehicleId) alerts = alerts.filter(a => a.vehicleId === filters.vehicleId);
    if (filters?.alertType) alerts = alerts.filter(a => a.alertType === filters.alertType);
    return alerts;
  }

  async getConnectivityAlerts(filters?: { vehicleId?: string; severity?: string }): Promise<ConnectivityAlert[]> {
    if (!this.shouldUseMock()) {
      const params = new URLSearchParams();
      if (filters?.vehicleId) params.set("vehicleId", filters.vehicleId);
      if (filters?.severity) params.set("severity", filters.severity);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await this.callIoTHubApi(`connectivity-alerts${query}`);
      if (result.success && result.data) {
        return result.data as ConnectivityAlert[];
      }
    }
    let alerts = this.getMockConnectivityAlerts();
    if (filters?.vehicleId) alerts = alerts.filter(a => a.vehicleId === filters.vehicleId);
    if (filters?.severity) alerts = alerts.filter(a => a.severity === filters.severity);
    return alerts;
  }

  isConnected(): boolean {
    return !this.shouldUseMock();
  }

  /** Toggle a device active (online) or inactive (offline). */
  async updateDeviceStatus(deviceId: string, active: boolean): Promise<IoTDevice | null> {
    if (!this.shouldUseMock()) {
      await this.callIoTHubApi(`devices/${encodeURIComponent(deviceId)}/status`, "POST", { active });
    }
    const newStatus = active ? "online" : "offline";
    const prev = this.mockDeviceOverrides.get(deviceId) ?? {};
    this.mockDeviceOverrides.set(deviceId, {
      ...prev,
      status: newStatus,
      signalStrengthPercent: active ? (prev.signalStrengthPercent ?? 80) : 0,
    });
    return this.getDevice(deviceId);
  }

  /** Reassign a device to a different vehicle. */
  async assignDeviceToVehicle(deviceId: string, vehicleId: string, licensePlate: string): Promise<IoTDevice | null> {
    if (!this.shouldUseMock()) {
      await this.callIoTHubApi(`devices/${encodeURIComponent(deviceId)}/assign`, "POST", { vehicleId, licensePlate });
    }
    const prev = this.mockDeviceOverrides.get(deviceId) ?? {};
    this.mockDeviceOverrides.set(deviceId, { ...prev, vehicleId, licensePlate });
    return this.getDevice(deviceId);
  }
}

export const iotHubClient = new IoTHubClient();
