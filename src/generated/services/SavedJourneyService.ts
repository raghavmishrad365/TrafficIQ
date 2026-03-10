// =============================================================================
// Dataverse Service: SavedJourneyService
// Table: tiq_savedjourney
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { SavedJourneyEntity } from "../models/SavedJourneyModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class SavedJourneyService {
  private static readonly entitySetName = "tiq_savedjourneies";

  static async create(
    record: Omit<SavedJourneyEntity, "tiq_savedjourneyid">
  ): Promise<IOperationResult<SavedJourneyEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<SavedJourneyEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<SavedJourneyEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<SavedJourneyEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<SavedJourneyEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<SavedJourneyEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<SavedJourneyEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
