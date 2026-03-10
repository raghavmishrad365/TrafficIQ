// =============================================================================
// Dataverse Table: tiq_warehouse
// Display Name: Warehouse
// Description: Warehouse/facility data synced from D365 F&O via MCP
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface WarehouseEntity {
  tiq_warehouseid?: string;
  tiq_name: string;
  tiq_warehousecode: string;
  tiq_latitude?: number;
  tiq_longitude?: number;
  tiq_address?: string;
  tiq_activeshipments?: number;
  tiq_pendingshipments?: number;
  tiq_totalinventoryitems?: number;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
