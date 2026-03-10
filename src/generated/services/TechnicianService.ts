// =============================================================================
// Dataverse Service: TechnicianService
// Table: tiq_technicians
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { TechnicianEntity } from "../models/TechnicianModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class TechnicianService {
  private static readonly entitySetName = "tiq_technicians";

  static async create(
    record: Omit<TechnicianEntity, "tiq_technicianid">
  ): Promise<IOperationResult<TechnicianEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<TechnicianEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<TechnicianEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<TechnicianEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<TechnicianEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<TechnicianEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<TechnicianEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<TechnicianEntity, "tiq_technicianid">
  ): Promise<IOperationResult<TechnicianEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<TechnicianEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
