// =============================================================================
// Dataverse Table: tiq_connectivityalert
// Display Name: Connectivity Alert
// Description: Device connectivity alerts from Azure IoT Hub
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

import { AlertSeverityOption } from "./MaintenanceAlertModel";

export enum ConnectivityAlertTypeOption {
  DeviceOffline = 100480000,
  SignalDegraded = 100480001,
  BatteryLow = 100480002,
  GPSSignalLost = 100480003,
}

export { AlertSeverityOption };

export interface ConnectivityAlertEntity {
  tiq_connectivityalertid?: string;
  tiq_name: string;

  /** Lookup: IoT Device */
  "tiq_iotdeviceid@odata.bind"?: string;
  _tiq_iotdeviceid_value?: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_alerttype: ConnectivityAlertTypeOption;
  tiq_severity: AlertSeverityOption;
  tiq_timestamp: string;
  tiq_resolvedat?: string;
  tiq_durationminutes?: number;
  tiq_details?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
