// =============================================================================
// Dataverse Service: InventoryItemService
// Table: tiq_inventoryitems
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { InventoryItemEntity } from "../models/InventoryItemModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class InventoryItemService {
  private static readonly entitySetName = "tiq_inventoryitems";

  static async create(
    record: Omit<InventoryItemEntity, "tiq_inventoryitemid">
  ): Promise<IOperationResult<InventoryItemEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<InventoryItemEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<InventoryItemEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<InventoryItemEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<InventoryItemEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<InventoryItemEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<InventoryItemEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<InventoryItemEntity, "tiq_inventoryitemid">
  ): Promise<IOperationResult<InventoryItemEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<InventoryItemEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
