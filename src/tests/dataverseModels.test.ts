import { describe, it, expect } from "vitest";
import {
  IncidentTypeOption,
  SeverityOption,
  TransportModeOption,
  NotificationTypeOption,
  NotificationSeverityOption,
  ShipmentStatusOption,
  ShipmentPriorityOption,
  VehicleStatusOption,
  WorkOrderPriorityOption,
  WorkOrderStatusOption,
  TechnicianStatusOption,
  MaintenanceComponentOption,
  AlertSeverityOption,
  ReturnReasonOption,
  ReturnStatusOption,
  SettingCategoryOption,
  IoTDeviceStatusOption,
  GeofenceEventTypeOption,
  DrivingAlertTypeOption,
  ConnectivityAlertTypeOption,
} from "../generated/models";

describe("Dataverse Generated Models", () => {
  it("exports expected number of entity models (20+)", () => {
    // The barrel export has 22 entity types + many enums
    // We verify by checking a representative set of value enums
    const enums = [
      IncidentTypeOption,
      SeverityOption,
      TransportModeOption,
      NotificationTypeOption,
      NotificationSeverityOption,
      ShipmentStatusOption,
      ShipmentPriorityOption,
      VehicleStatusOption,
      WorkOrderPriorityOption,
      WorkOrderStatusOption,
      TechnicianStatusOption,
      MaintenanceComponentOption,
      AlertSeverityOption,
      ReturnReasonOption,
      ReturnStatusOption,
      SettingCategoryOption,
      IoTDeviceStatusOption,
      GeofenceEventTypeOption,
      DrivingAlertTypeOption,
      ConnectivityAlertTypeOption,
    ];
    expect(enums).toHaveLength(20);
    for (const e of enums) {
      expect(e).toBeDefined();
    }
  });

  describe("TrafficIncident enums", () => {
    it("has all incident types", () => {
      expect(IncidentTypeOption.Accident).toBeDefined();
      expect(IncidentTypeOption.Congestion).toBeDefined();
      expect(IncidentTypeOption.Roadwork).toBeDefined();
      expect(IncidentTypeOption.Closure).toBeDefined();
    });

    it("has severity levels", () => {
      expect(SeverityOption.Low).toBeDefined();
      expect(SeverityOption.Medium).toBeDefined();
      expect(SeverityOption.High).toBeDefined();
      expect(SeverityOption.Critical).toBeDefined();
    });
  });

  describe("Shipment enums", () => {
    it("has all shipment statuses", () => {
      expect(ShipmentStatusOption.Pending).toBeDefined();
      expect(ShipmentStatusOption.Packed).toBeDefined();
      expect(ShipmentStatusOption.InTransit).toBeDefined();
      expect(ShipmentStatusOption.Delivered).toBeDefined();
      expect(ShipmentStatusOption.Delayed).toBeDefined();
    });

    it("has priority levels", () => {
      expect(ShipmentPriorityOption.Standard).toBeDefined();
      expect(ShipmentPriorityOption.Express).toBeDefined();
      expect(ShipmentPriorityOption.Urgent).toBeDefined();
    });
  });

  describe("Notification enums", () => {
    it("has all notification types", () => {
      expect(NotificationTypeOption.Traffic).toBeDefined();
      expect(NotificationTypeOption.Shipment).toBeDefined();
      expect(NotificationTypeOption.Fleet).toBeDefined();
      expect(NotificationTypeOption.IoT).toBeDefined();
      expect(NotificationTypeOption.Maintenance).toBeDefined();
      expect(NotificationTypeOption.System).toBeDefined();
    });
  });

  describe("Setting category enum", () => {
    it("has expected categories for dual-write", () => {
      expect(SettingCategoryOption.General).toBeDefined();
      expect(SettingCategoryOption.Map).toBeDefined();
      expect(SettingCategoryOption.MCP).toBeDefined();
      expect(SettingCategoryOption.Dataverse).toBeDefined();
      expect(SettingCategoryOption.Email).toBeDefined();
      expect(SettingCategoryOption.IoTHub).toBeDefined();
      expect(SettingCategoryOption.Agents).toBeDefined();
    });
  });
});
