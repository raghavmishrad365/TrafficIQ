// =============================================================================
// Dataverse Table: tiq_trafficincident
// Display Name: Traffic Incident
// Description: Traffic incidents from Vejdirektoratet, Azure Maps, and AI agents
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum IncidentTypeOption {
  Accident = 100480000,
  Roadwork = 100480001,
  Congestion = 100480002,
  Closure = 100480003,
  Other = 100480004,
}

export enum SeverityOption {
  Low = 100480000,
  Medium = 100480001,
  High = 100480002,
  Critical = 100480003,
}

export enum DataSourceOption {
  Vejdirektoratet = 100480000,
  AzureMaps = 100480001,
  Agent = 100480002,
}

export interface TrafficIncidentEntity {
  tiq_trafficincidentid: string;
  tiq_title: string;
  tiq_description?: string;
  tiq_incidenttype: IncidentTypeOption;
  tiq_severity: SeverityOption;
  tiq_latitude: number;
  tiq_longitude: number;
  tiq_roadname?: string;
  tiq_starttime?: string;
  tiq_endtime?: string;
  tiq_delayminutes?: number;
  tiq_source: DataSourceOption;
  tiq_externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
