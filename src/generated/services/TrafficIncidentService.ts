// =============================================================================
// Dataverse Service: TrafficIncidentService
// Table: tiq_trafficincident
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { TrafficIncidentEntity } from "../models/TrafficIncidentModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class TrafficIncidentService {
  private static readonly entitySetName = "tiq_trafficincidents";

  static async create(
    record: Omit<TrafficIncidentEntity, "tiq_trafficincidentid">
  ): Promise<IOperationResult<TrafficIncidentEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<TrafficIncidentEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<TrafficIncidentEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<TrafficIncidentEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<TrafficIncidentEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<TrafficIncidentEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<TrafficIncidentEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
