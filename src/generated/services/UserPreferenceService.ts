// =============================================================================
// Dataverse Service: UserPreferenceService
// Table: tiq_userpreference
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { UserPreferenceEntity } from "../models/UserPreferenceModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class UserPreferenceService {
  private static readonly entitySetName = "tiq_userpreferences";

  static async create(
    record: Omit<UserPreferenceEntity, "tiq_userpreferenceid">
  ): Promise<IOperationResult<UserPreferenceEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<UserPreferenceEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<UserPreferenceEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<UserPreferenceEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<UserPreferenceEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<UserPreferenceEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<UserPreferenceEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
