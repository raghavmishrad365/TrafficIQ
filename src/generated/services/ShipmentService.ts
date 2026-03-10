// =============================================================================
// Dataverse Service: ShipmentService
// Table: tiq_shipments
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { ShipmentEntity } from "../models/ShipmentModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class ShipmentService {
  private static readonly entitySetName = "tiq_shipments";

  static async create(
    record: Omit<ShipmentEntity, "tiq_shipmentid">
  ): Promise<IOperationResult<ShipmentEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<ShipmentEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<ShipmentEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<ShipmentEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<ShipmentEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<ShipmentEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<ShipmentEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }

  static async upsertByExternalId(
    externalId: string,
    record: Omit<ShipmentEntity, "tiq_shipmentid">
  ): Promise<IOperationResult<ShipmentEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.upsertByExternalId<ShipmentEntity>(
      this.entitySetName, "tiq_d365externalid", externalId, record
    );
  }
}
