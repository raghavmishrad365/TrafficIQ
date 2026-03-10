// =============================================================================
// Dataverse Service: MaintenanceRecordService
// Table: tiq_maintenancerecords
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { MaintenanceRecordEntity } from "../models/MaintenanceRecordModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class MaintenanceRecordService {
  private static readonly entitySetName = "tiq_maintenancerecords";

  static async create(
    record: Omit<MaintenanceRecordEntity, "tiq_maintenancerecordid">
  ): Promise<IOperationResult<MaintenanceRecordEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<MaintenanceRecordEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<MaintenanceRecordEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<MaintenanceRecordEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<MaintenanceRecordEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<MaintenanceRecordEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<MaintenanceRecordEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<MaintenanceRecordEntity, "tiq_maintenancerecordid">
  ): Promise<IOperationResult<MaintenanceRecordEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<MaintenanceRecordEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
