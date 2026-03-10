// =============================================================================
// Dataverse Table: tiq_routestep
// Display Name: Route Step
// Description: Turn-by-turn direction steps for routes
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface RouteStepRecord {
  tiq_routestepid?: string;
  tiq_instruction: string;

  /** Lookup: Route Option ID */
  "tiq_routeoptionid@odata.bind"?: string;
  _tiq_routeoptionid_value?: string;

  tiq_distancekm?: number;
  tiq_durationminutes?: number;
  tiq_maneuver?: string;
  tiq_roadname?: string;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_steporder: number;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}
