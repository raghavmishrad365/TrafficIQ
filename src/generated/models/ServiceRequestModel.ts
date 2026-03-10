// =============================================================================
// Dataverse Table: tiq_servicerequest
// Display Name: Service Request
// Description: Field service requests with SLA tracking
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum ServiceRequestPriorityOption {
  Low = 100480000,
  Medium = 100480001,
  High = 100480002,
  Critical = 100480003,
}

export enum ServiceRequestStatusOption {
  New = 100480000,
  Assigned = 100480001,
  InProgress = 100480002,
  OnHold = 100480003,
  Completed = 100480004,
  Cancelled = 100480005,
}

export enum SLAStatusOption {
  OnTrack = 100480000,
  AtRisk = 100480001,
  Breached = 100480002,
}

export interface ServiceRequestEntity {
  tiq_servicerequestid?: string;
  tiq_title: string;
  tiq_customername: string;
  tiq_customersiteid?: string;
  tiq_customeraddress?: string;

  /** Lookup: Customer Asset */
  "tiq_assetid@odata.bind"?: string;
  _tiq_assetid_value?: string;

  tiq_priority: ServiceRequestPriorityOption;
  tiq_status: ServiceRequestStatusOption;
  tiq_servicetype?: string;
  tiq_description?: string;
  tiq_sladeadline?: string;
  tiq_slastatus?: SLAStatusOption;

  /** Lookup: Assigned Technician */
  "tiq_assignedtechnicianid@odata.bind"?: string;
  _tiq_assignedtechnicianid_value?: string;

  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_createdat?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
