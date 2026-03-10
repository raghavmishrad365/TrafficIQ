// =============================================================================
// Dataverse Table: tiq_drivingalert
// Display Name: Driving Alert
// Description: Driver behavior alerts from IoT telemetry
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

import { AlertSeverityOption } from "./MaintenanceAlertModel";

export enum DrivingAlertTypeOption {
  Speeding = 100480000,
  HarshBraking = 100480001,
  ExcessiveIdling = 100480002,
  RouteDeviation = 100480003,
}

export { AlertSeverityOption };

export interface DrivingAlertEntity {
  tiq_drivingalertid?: string;
  tiq_name: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_drivername?: string;
  tiq_alerttype: DrivingAlertTypeOption;
  tiq_severity: AlertSeverityOption;
  tiq_timestamp: string;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_locationlabel?: string;
  tiq_details?: string;
  tiq_speedkmh?: number;
  tiq_speedlimitkmh?: number;
  tiq_durationseconds?: number;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
