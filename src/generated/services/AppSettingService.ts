// =============================================================================
// Dataverse Service: AppSettingService
// Table: tiq_appsettings
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { AppSettingEntity } from "../models/AppSettingModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class AppSettingService {
  private static readonly entitySetName = "tiq_appsettings";

  static async create(
    record: Omit<AppSettingEntity, "tiq_appsettingid">
  ): Promise<IOperationResult<AppSettingEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<AppSettingEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<AppSettingEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<AppSettingEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<AppSettingEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<AppSettingEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<AppSettingEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
