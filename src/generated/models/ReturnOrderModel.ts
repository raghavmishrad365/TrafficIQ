// =============================================================================
// Dataverse Table: tiq_returnorder
// Display Name: Return Order
// Description: Return/RMA orders for reverse logistics processing
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum ReturnReasonOption {
  Damaged = 100480000,
  WrongItem = 100480001,
  QualityIssue = 100480002,
  ChangedMind = 100480003,
  Defective = 100480004,
  Other = 100480005,
}

export enum ReturnStatusOption {
  Requested = 100480000,
  Approved = 100480001,
  PickupScheduled = 100480002,
  InTransit = 100480003,
  Received = 100480004,
  Processed = 100480005,
  Rejected = 100480006,
}

export interface ReturnOrderEntity {
  tiq_returnorderid?: string;
  tiq_returnid_display: string;

  /** Lookup: Original Shipment */
  "tiq_originalshipmentid@odata.bind"?: string;
  _tiq_originalshipmentid_value?: string;

  tiq_customername: string;
  tiq_reason: ReturnReasonOption;
  tiq_status: ReturnStatusOption;
  tiq_items?: string;
  tiq_requesteddate?: string;
  tiq_pickupdate?: string;
  tiq_receiveddate?: string;
  tiq_refundamount?: number;

  /** Lookup: Warehouse */
  "tiq_warehouseid@odata.bind"?: string;
  _tiq_warehouseid_value?: string;

  tiq_notes?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
