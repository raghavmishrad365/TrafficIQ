// =============================================================================
// Dataverse Service: ConnectivityAlertService
// Table: tiq_connectivityalerts
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { ConnectivityAlertEntity } from "../models/ConnectivityAlertModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class ConnectivityAlertService {
  private static readonly entitySetName = "tiq_connectivityalerts";

  static async create(
    record: Omit<ConnectivityAlertEntity, "tiq_connectivityalertid">
  ): Promise<IOperationResult<ConnectivityAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<ConnectivityAlertEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<ConnectivityAlertEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<ConnectivityAlertEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<ConnectivityAlertEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<ConnectivityAlertEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<ConnectivityAlertEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
