// =============================================================================
// Dataverse Table: tiq_geofenceevent
// Display Name: Geofence Event
// Description: Geofence entry/exit events from Azure IoT Hub
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum GeofenceEventTypeOption {
  Entry = 100480000,
  Exit = 100480001,
}

export interface GeofenceEventEntity {
  tiq_geofenceeventid?: string;
  tiq_name: string;

  /** Lookup: Geofence Zone */
  "tiq_geofencezoneid@odata.bind"?: string;
  _tiq_geofencezoneid_value?: string;

  /** Lookup: Fleet Vehicle */
  "tiq_fleetvehicleid@odata.bind"?: string;
  _tiq_fleetvehicleid_value?: string;

  tiq_drivername?: string;
  tiq_eventtype: GeofenceEventTypeOption;
  tiq_timestamp: string;
  tiq_dwelltimeminutes?: number;
  tiq_expectedentry?: boolean;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
