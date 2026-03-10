// =============================================================================
// Dataverse Table: tiq_geofencezone
// Display Name: Geofence Zone
// Description: Geographic boundary definitions for warehouse zones
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface GeofenceZoneEntity {
  tiq_geofencezoneid?: string;
  tiq_name: string;
  tiq_centerlatitude: number;
  tiq_centerlongitude: number;
  tiq_radiusmeters: number;

  /** Lookup: Warehouse */
  "tiq_warehouseid@odata.bind"?: string;
  _tiq_warehouseid_value?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
