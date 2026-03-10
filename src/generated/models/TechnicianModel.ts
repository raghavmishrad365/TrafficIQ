// =============================================================================
// Dataverse Table: tiq_technician
// Display Name: Technician
// Description: Field service technician/resource data
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum TechnicianStatusOption {
  Available = 100480000,
  OnJob = 100480001,
  OffDuty = 100480002,
}

export interface TechnicianEntity {
  tiq_technicianid?: string;
  tiq_name: string;
  tiq_skills?: string;
  tiq_status: TechnicianStatusOption;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_locationlabel?: string;
  tiq_todayworkorders?: number;
  tiq_completedtoday?: number;
  tiq_phone?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
