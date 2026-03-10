// =============================================================================
// Dataverse Service: GeofenceEventService
// Table: tiq_geofenceevents
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { GeofenceEventEntity } from "../models/GeofenceEventModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class GeofenceEventService {
  private static readonly entitySetName = "tiq_geofenceevents";

  static async create(
    record: Omit<GeofenceEventEntity, "tiq_geofenceeventid">
  ): Promise<IOperationResult<GeofenceEventEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<GeofenceEventEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<GeofenceEventEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<GeofenceEventEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<GeofenceEventEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<GeofenceEventEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<GeofenceEventEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
