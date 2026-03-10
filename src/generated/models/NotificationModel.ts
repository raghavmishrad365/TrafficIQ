// =============================================================================
// Dataverse Table: tiq_notification
// Display Name: Notification
// Description: Application notifications for all domains
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum NotificationTypeOption {
  Traffic = 100480000,
  Journey = 100480001,
  System = 100480002,
  Shipment = 100480003,
  Fleet = 100480004,
  IoT = 100480005,
  Maintenance = 100480006,
}

export enum NotificationSeverityOption {
  Info = 100480000,
  Warning = 100480001,
  Error = 100480002,
  Success = 100480003,
}

export interface NotificationEntity {
  tiq_notificationid: string;
  tiq_title: string;
  tiq_body?: string;
  tiq_notificationtype: NotificationTypeOption;
  tiq_isread?: boolean;
  tiq_severity?: NotificationSeverityOption;

  /** Lookup: Related Journey */
  "tiq_journeyid@odata.bind"?: string;
  _tiq_journeyid_value?: string;

  /** Lookup: Related Incident */
  "tiq_incidentid@odata.bind"?: string;
  _tiq_incidentid_value?: string;

  /** Lookup: Related Shipment */
  "tiq_shipmentid@odata.bind"?: string;
  _tiq_shipmentid_value?: string;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
