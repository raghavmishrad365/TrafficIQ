// =============================================================================
// Dataverse Service: DrivingAlertService
// Table: tiq_drivingalerts
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { DrivingAlertEntity } from "../models/DrivingAlertModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class DrivingAlertService {
  private static readonly entitySetName = "tiq_drivingalerts";

  static async create(
    record: Omit<DrivingAlertEntity, "tiq_drivingalertid">
  ): Promise<IOperationResult<DrivingAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<DrivingAlertEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<DrivingAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<DrivingAlertEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<DrivingAlertEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<DrivingAlertEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<DrivingAlertEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
