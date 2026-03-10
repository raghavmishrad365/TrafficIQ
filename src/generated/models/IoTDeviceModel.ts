// =============================================================================
// Dataverse Table: tiq_iotdevice
// Display Name: IoT Device
// Description: IoT device registry and status from Azure IoT Hub
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum IoTDeviceStatusOption {
  Online = 100480000,
  Offline = 100480001,
  Degraded = 100480002,
}

export interface IoTDeviceEntity {
  tiq_iotdeviceid?: string;
  tiq_devicecode: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_licenseplate?: string;
  tiq_devicemodel?: string;
  tiq_firmwareversion?: string;
  tiq_status: IoTDeviceStatusOption;
  tiq_signalstrengthpercent?: number;
  tiq_batterylevelpercent?: number;
  tiq_lastheartbeat?: string;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_locationlabel?: string;
  tiq_installeddate?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
