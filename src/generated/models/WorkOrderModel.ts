// =============================================================================
// Dataverse Table: tiq_workorder
// Display Name: Work Order
// Description: Operations work orders from D365 F&O
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum WorkOrderPriorityOption {
  Low = 100480000,
  Medium = 100480001,
  High = 100480002,
  Critical = 100480003,
}

export enum WorkOrderStatusOption {
  Unscheduled = 100480000,
  Scheduled = 100480001,
  InProgress = 100480002,
  Completed = 100480003,
  Cancelled = 100480004,
}

export interface WorkOrderEntity {
  tiq_workorderid?: string;
  tiq_workorderid_display: string;
  tiq_customername: string;
  tiq_servicetype: string;
  tiq_priority: WorkOrderPriorityOption;
  tiq_requiredskills?: string;
  tiq_status: WorkOrderStatusOption;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_locationlabel?: string;
  tiq_estimatedduration?: number;
  tiq_scheduleddate?: string;

  /** Lookup: Assigned Technician */
  "tiq_assignedtechnicianid@odata.bind"?: string;
  _tiq_assignedtechnicianid_value?: string;

  tiq_description?: string;
  tiq_createddate?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
