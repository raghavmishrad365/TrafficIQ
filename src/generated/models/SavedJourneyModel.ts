// =============================================================================
// Dataverse Table: tiq_savedjourney
// Display Name: Saved Journey
// Description: User-saved journey routes with preferences
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum TransportModeOption {
  Car = 100480000,
  Transit = 100480001,
  Bicycle = 100480002,
  Walk = 100480003,
}

export interface SavedJourneyEntity {
  tiq_savedjourneyid: string;
  tiq_name: string;

  // Origin
  tiq_originlabel: string;
  tiq_originaddress?: string;
  tiq_originlatitude: number;
  tiq_originlongitude: number;

  // Destination
  tiq_destinationlabel: string;
  tiq_destinationaddress?: string;
  tiq_destinationlatitude: number;
  tiq_destinationlongitude: number;

  // Preferences
  tiq_transportmode: TransportModeOption;
  tiq_avoidtolls?: boolean;
  tiq_avoidhighways?: boolean;

  // Morning Alert
  tiq_morningalertenabled?: boolean;
  tiq_morningalerttime?: string;
  tiq_morningalertdays?: string;
  tiq_morningalertemail?: boolean;
  tiq_morningalertpush?: boolean;

  tiq_lastusedat?: string;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
