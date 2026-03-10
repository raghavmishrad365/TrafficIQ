// =============================================================================
// Dataverse Table: tiq_vehiclehealth
// Display Name: Vehicle Health
// Description: Vehicle health scores and predicted maintenance windows
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface VehicleHealthEntity {
  tiq_vehiclehealthid?: string;
  tiq_name: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_healthscore: number;
  tiq_lastservicedate?: string;
  tiq_nextpredictedservice?: string;
  tiq_mileagekm?: number;
  tiq_enginehours?: number;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
