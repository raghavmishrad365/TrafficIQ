// =============================================================================
// Dataverse Service: ReturnOrderService
// Table: tiq_returnorders
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { ReturnOrderEntity } from "../models/ReturnOrderModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class ReturnOrderService {
  private static readonly entitySetName = "tiq_returnorders";

  static async create(
    record: Omit<ReturnOrderEntity, "tiq_returnorderid">
  ): Promise<IOperationResult<ReturnOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<ReturnOrderEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<ReturnOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<ReturnOrderEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<ReturnOrderEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<ReturnOrderEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<ReturnOrderEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<ReturnOrderEntity, "tiq_returnorderid">
  ): Promise<IOperationResult<ReturnOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<ReturnOrderEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
