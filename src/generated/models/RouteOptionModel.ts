// =============================================================================
// Dataverse Table: tiq_routeoption
// Display Name: Route Option
// Description: Route alternatives with distance, duration, and traffic data
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface RouteOptionRecord {
  tiq_routeoptionid?: string;
  tiq_summary: string;

  /** Lookup: Saved Journey ID */
  "tiq_savedjourneyid@odata.bind"?: string;
  _tiq_savedjourneyid_value?: string;

  tiq_durationminutes: number;
  tiq_durationintrafficminutes?: number;
  tiq_distancekm: number;
  tiq_departuretime?: string;
  tiq_arrivaltime?: string;
  tiq_coordinates?: string;
  tiq_trafficdelayminutes?: number;
  tiq_isrecommended?: boolean;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}
