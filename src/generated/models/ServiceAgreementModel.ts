// =============================================================================
// Dataverse Table: tiq_serviceagreement
// Display Name: Service Agreement
// Description: Service contracts and SLA definitions
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum ContractTypeOption {
  Basic = 100480000,
  Standard = 100480001,
  Premium = 100480002,
}

export enum AgreementStatusOption {
  Active = 100480000,
  Expiring = 100480001,
  Expired = 100480002,
}

export interface ServiceAgreementEntity {
  tiq_serviceagreementid?: string;
  tiq_name: string;
  tiq_customername: string;
  tiq_contracttype: ContractTypeOption;
  tiq_startdate: string;
  tiq_enddate: string;
  tiq_responsetimeslahours?: number;
  tiq_resolutiontimeslahours?: number;
  tiq_coveragehours?: string;
  tiq_assetscount?: number;
  tiq_monthlyvisitsincluded?: number;
  tiq_status: AgreementStatusOption;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
