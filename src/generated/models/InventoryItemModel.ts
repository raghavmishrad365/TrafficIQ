// =============================================================================
// Dataverse Table: tiq_inventoryitem
// Display Name: Inventory Item
// Description: Warehouse stock levels and reorder points from D365 F&O via MCP
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface InventoryItemEntity {
  tiq_inventoryitemid?: string;
  tiq_itemname: string;
  tiq_itemcode: string;

  /** Lookup: Warehouse */
  "tiq_warehouseid@odata.bind"?: string;
  _tiq_warehouseid_value?: string;

  tiq_quantityonhand: number;
  tiq_quantityreserved?: number;
  tiq_quantityavailable?: number;
  tiq_unit?: string;
  tiq_reorderpoint?: number;
  tiq_lastupdated?: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
