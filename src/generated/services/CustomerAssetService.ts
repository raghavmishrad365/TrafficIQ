// =============================================================================
// Dataverse Service: CustomerAssetService
// Table: tiq_customerassets
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { CustomerAssetEntity } from "../models/CustomerAssetModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class CustomerAssetService {
  private static readonly entitySetName = "tiq_customerassets";

  static async create(
    record: Omit<CustomerAssetEntity, "tiq_customerassetid">
  ): Promise<IOperationResult<CustomerAssetEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<CustomerAssetEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<CustomerAssetEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<CustomerAssetEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<CustomerAssetEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<CustomerAssetEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<CustomerAssetEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
