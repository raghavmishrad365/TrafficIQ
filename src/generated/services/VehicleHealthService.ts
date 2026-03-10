// =============================================================================
// Dataverse Service: VehicleHealthService
// Table: tiq_vehiclehealths
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { VehicleHealthEntity } from "../models/VehicleHealthModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class VehicleHealthService {
  private static readonly entitySetName = "tiq_vehiclehealths";

  static async create(
    record: Omit<VehicleHealthEntity, "tiq_vehiclehealthid">
  ): Promise<IOperationResult<VehicleHealthEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<VehicleHealthEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<VehicleHealthEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<VehicleHealthEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<VehicleHealthEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<VehicleHealthEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<VehicleHealthEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<VehicleHealthEntity, "tiq_vehiclehealthid">
  ): Promise<IOperationResult<VehicleHealthEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<VehicleHealthEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
