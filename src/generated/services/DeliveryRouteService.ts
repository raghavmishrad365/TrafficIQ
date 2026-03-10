// =============================================================================
// Dataverse Service: DeliveryRouteService
// Table: tiq_deliveryroutes
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { DeliveryRouteEntity } from "../models/DeliveryRouteModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class DeliveryRouteService {
  private static readonly entitySetName = "tiq_deliveryroutes";

  static async create(
    record: Omit<DeliveryRouteEntity, "tiq_deliveryrouteid">
  ): Promise<IOperationResult<DeliveryRouteEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<DeliveryRouteEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<DeliveryRouteEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<DeliveryRouteEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<DeliveryRouteEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<DeliveryRouteEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<DeliveryRouteEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
