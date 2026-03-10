// =============================================================================
// Dataverse Service: WorkOrderService
// Table: tiq_workorders
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { WorkOrderEntity } from "../models/WorkOrderModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class WorkOrderService {
  private static readonly entitySetName = "tiq_workorders";

  static async create(
    record: Omit<WorkOrderEntity, "tiq_workorderid">
  ): Promise<IOperationResult<WorkOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<WorkOrderEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<WorkOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<WorkOrderEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<WorkOrderEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<WorkOrderEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<WorkOrderEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<WorkOrderEntity, "tiq_workorderid">
  ): Promise<IOperationResult<WorkOrderEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<WorkOrderEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
