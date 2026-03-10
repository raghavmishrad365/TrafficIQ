// =============================================================================
// Dataverse Table: tiq_routeoption (used for route history)
// Display Name: Route Option
// Description: Route alternatives with distance, duration, and traffic data
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface RouteHistoryEntity {
  tiq_routeoptionid: string;
  tiq_summary: string;

  /** Lookup: Saved Journey */
  _tiq_savedjourneyid_value?: string;
  "tiq_savedjourneyid@odata.bind"?: string;

  tiq_durationminutes: number;
  tiq_durationintrafficminutes?: number;
  tiq_distancekm: number;
  tiq_departuretime?: string;
  tiq_arrivaltime?: string;
  tiq_coordinates?: string;
  tiq_trafficdelayminutes?: number;
  tiq_isrecommended?: boolean;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
