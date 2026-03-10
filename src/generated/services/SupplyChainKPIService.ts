// =============================================================================
// Dataverse Service: SupplyChainKPIService
// Table: tiq_supplychainkpis
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { SupplyChainKPIEntity } from "../models/SupplyChainKPIModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class SupplyChainKPIService {
  private static readonly entitySetName = "tiq_supplychainkpis";

  static async create(
    record: Omit<SupplyChainKPIEntity, "tiq_supplychainkpiid">
  ): Promise<IOperationResult<SupplyChainKPIEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<SupplyChainKPIEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<SupplyChainKPIEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<SupplyChainKPIEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<SupplyChainKPIEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<SupplyChainKPIEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<SupplyChainKPIEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<SupplyChainKPIEntity, "tiq_supplychainkpiid">
  ): Promise<IOperationResult<SupplyChainKPIEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<SupplyChainKPIEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
