// =============================================================================
// Dataverse Table: tiq_deliveryroute
// Display Name: Delivery Route
// Description: Optimized delivery routes with multi-stop waypoints
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface DeliveryRouteEntity {
  tiq_deliveryrouteid?: string;
  tiq_name: string;

  /** Lookup: Warehouse */
  "tiq_warehouseid@odata.bind"?: string;
  _tiq_warehouseid_value?: string;

  tiq_originlatitude?: number;
  tiq_originlongitude?: number;
  tiq_stops?: string;
  tiq_totaldistancekm?: number;
  tiq_totaldurationminutes?: number;
  tiq_trafficdelayminutes?: number;
  tiq_optimizedorder?: string;
  tiq_coordinates?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
