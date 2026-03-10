// =============================================================================
// Dataverse Table: tiq_shipment
// Display Name: Shipment
// Description: Shipment data synced from D365 F&O via MCP
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum ShipmentStatusOption {
  Pending = 100480000,
  Picked = 100480001,
  Packed = 100480002,
  InTransit = 100480003,
  Delivered = 100480004,
  Delayed = 100480005,
  Cancelled = 100480006,
}

export enum ShipmentPriorityOption {
  Standard = 100480000,
  Express = 100480001,
  Urgent = 100480002,
}

export interface ShipmentEntity {
  tiq_shipmentid?: string;
  tiq_shipmentid_display: string;

  /** Lookup: Warehouse */
  "tiq_warehouseid@odata.bind"?: string;
  _tiq_warehouseid_value?: string;

  tiq_warehousename?: string;
  tiq_originlabel: string;
  tiq_originlatitude?: number;
  tiq_originlongitude?: number;
  tiq_destinationlabel: string;
  tiq_destinationlatitude?: number;
  tiq_destinationlongitude?: number;
  tiq_customername?: string;
  tiq_status: ShipmentStatusOption;
  tiq_priority: ShipmentPriorityOption;
  tiq_scheduleddate?: string;
  tiq_estimatedarrival?: string;
  tiq_actualdeparture?: string;
  tiq_items?: string;
  tiq_totalweight?: number;
  tiq_currenttrafficdelay?: number;
  tiq_routedistancekm?: number;
  tiq_routedurationminutes?: number;
  tiq_trackingevents?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
