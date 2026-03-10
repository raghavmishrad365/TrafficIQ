// =============================================================================
// Dataverse Service: WarehouseService
// Table: tiq_warehouses
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { WarehouseEntity } from "../models/WarehouseModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class WarehouseService {
  private static readonly entitySetName = "tiq_warehouses";

  static async create(
    record: Omit<WarehouseEntity, "tiq_warehouseid">
  ): Promise<IOperationResult<WarehouseEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<WarehouseEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<WarehouseEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<WarehouseEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<WarehouseEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<WarehouseEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<WarehouseEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<WarehouseEntity, "tiq_warehouseid">
  ): Promise<IOperationResult<WarehouseEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<WarehouseEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
