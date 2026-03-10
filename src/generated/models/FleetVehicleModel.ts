// =============================================================================
// Dataverse Table: tiq_fleetvehicle
// Display Name: Fleet Vehicle
// Description: Fleet vehicle data with real-time status from D365 F&O and IoT
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum VehicleStatusOption {
  InTransit = 100480000,
  Idle = 100480001,
  Maintenance = 100480002,
  Returning = 100480003,
}

export interface FleetVehicleEntity {
  tiq_fleetvehicleid?: string;
  tiq_vehiclecode: string;
  tiq_licenseplate: string;
  tiq_drivername?: string;
  tiq_driverid?: string;
  tiq_status: VehicleStatusOption;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_locationlabel?: string;
  tiq_assignedroute?: string;

  /** Lookup: Current Shipment */
  "tiq_currentshipmentid@odata.bind"?: string;
  _tiq_currentshipmentid_value?: string;

  tiq_loadpercent?: number;
  tiq_speedkmh?: number;
  tiq_fuellevelpercent?: number;
  tiq_hoursonduty?: number;
  tiq_distancetodaykm?: number;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
