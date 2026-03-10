// =============================================================================
// Dataverse Service: GeofenceZoneService
// Table: tiq_geofencezones
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { GeofenceZoneEntity } from "../models/GeofenceZoneModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class GeofenceZoneService {
  private static readonly entitySetName = "tiq_geofencezones";

  static async create(
    record: Omit<GeofenceZoneEntity, "tiq_geofencezoneid">
  ): Promise<IOperationResult<GeofenceZoneEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<GeofenceZoneEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<GeofenceZoneEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<GeofenceZoneEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<GeofenceZoneEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<GeofenceZoneEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<GeofenceZoneEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
