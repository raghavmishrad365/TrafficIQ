// =============================================================================
// Dataverse Service: RouteHistoryService
// Table: tiq_routeoption (used as route history)
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { RouteOptionRecord } from "../models/RouteOptionModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class RouteHistoryService {
  private static readonly entitySetName = "tiq_routeoptions";

  static async create(
    record: Omit<RouteOptionRecord, "tiq_routeoptionid">
  ): Promise<IOperationResult<RouteOptionRecord>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<RouteOptionRecord>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<RouteOptionRecord>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<RouteOptionRecord>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<RouteOptionRecord[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<RouteOptionRecord>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<RouteOptionRecord>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
