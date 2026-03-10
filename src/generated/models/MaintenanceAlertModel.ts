// =============================================================================
// Dataverse Table: tiq_maintenancealert
// Display Name: Maintenance Alert
// Description: Predictive maintenance alerts from AI/IoT analysis
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum MaintenanceComponentOption {
  Brakes = 100480000,
  Oil = 100480001,
  Tires = 100480002,
  Battery = 100480003,
  Transmission = 100480004,
  Coolant = 100480005,
  Filters = 100480006,
}

export enum AlertSeverityOption {
  Low = 100480000,
  Medium = 100480001,
  High = 100480002,
  Critical = 100480003,
}

export interface MaintenanceAlertEntity {
  tiq_maintenancealertid?: string;
  tiq_name: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_component: MaintenanceComponentOption;
  tiq_severity: AlertSeverityOption;
  tiq_predictedfailuredate?: string;
  tiq_confidencepercent?: number;
  tiq_recommendedaction?: string;
  tiq_estimatedcost?: number;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
