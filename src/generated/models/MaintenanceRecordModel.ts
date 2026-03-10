// =============================================================================
// Dataverse Table: tiq_maintenancerecord
// Display Name: Maintenance Record
// Description: Historical vehicle maintenance/service records
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface MaintenanceRecordEntity {
  tiq_maintenancerecordid?: string;
  tiq_name: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_servicetype: string;
  tiq_servicedate: string;
  tiq_cost?: number;
  tiq_technician?: string;
  tiq_notes?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
