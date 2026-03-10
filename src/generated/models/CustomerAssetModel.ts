// =============================================================================
// Dataverse Table: tiq_customerasset
// Display Name: Customer Asset
// Description: Customer equipment and assets for field service
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum WarrantyStatusOption {
  Active = 100480000,
  ExpiringSoon = 100480001,
  Expired = 100480002,
}

export enum AssetOperationalStatusOption {
  Operational = 100480000,
  Degraded = 100480001,
  Down = 100480002,
}

export interface CustomerAssetEntity {
  tiq_customerassetid?: string;
  tiq_assetname: string;
  tiq_customerid?: string;
  tiq_customername?: string;
  tiq_model?: string;
  tiq_serialnumber?: string;
  tiq_location?: string;
  tiq_warrantyexpiry?: string;
  tiq_warrantystatus?: WarrantyStatusOption;
  tiq_lastservicedate?: string;
  tiq_servicecount?: number;
  tiq_healthscore?: number;
  tiq_operationalstatus?: AssetOperationalStatusOption;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
