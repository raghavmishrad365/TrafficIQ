// =============================================================================
// Dataverse Service: MaintenanceAlertService
// Table: tiq_maintenancealerts
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { MaintenanceAlertEntity } from "../models/MaintenanceAlertModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class MaintenanceAlertService {
  private static readonly entitySetName = "tiq_maintenancealerts";

  static async create(
    record: Omit<MaintenanceAlertEntity, "tiq_maintenancealertid">
  ): Promise<IOperationResult<MaintenanceAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<MaintenanceAlertEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<MaintenanceAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<MaintenanceAlertEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<MaintenanceAlertEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<MaintenanceAlertEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<MaintenanceAlertEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<MaintenanceAlertEntity, "tiq_maintenancealertid">
  ): Promise<IOperationResult<MaintenanceAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<MaintenanceAlertEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
