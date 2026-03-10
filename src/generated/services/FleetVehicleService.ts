// =============================================================================
// Dataverse Service: FleetVehicleService
// Table: tiq_fleetvehicles
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { FleetVehicleEntity } from "../models/FleetVehicleModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class FleetVehicleService {
  private static readonly entitySetName = "tiq_fleetvehicles";

  static async create(
    record: Omit<FleetVehicleEntity, "tiq_fleetvehicleid">
  ): Promise<IOperationResult<FleetVehicleEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<FleetVehicleEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<FleetVehicleEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<FleetVehicleEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<FleetVehicleEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<FleetVehicleEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<FleetVehicleEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<FleetVehicleEntity, "tiq_fleetvehicleid">
  ): Promise<IOperationResult<FleetVehicleEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<FleetVehicleEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
