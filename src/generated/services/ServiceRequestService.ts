// =============================================================================
// Dataverse Service: ServiceRequestService
// Table: tiq_servicerequests
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { ServiceRequestEntity } from "../models/ServiceRequestModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class ServiceRequestService {
  private static readonly entitySetName = "tiq_servicerequests";

  static async create(
    record: Omit<ServiceRequestEntity, "tiq_servicerequestid">
  ): Promise<IOperationResult<ServiceRequestEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<ServiceRequestEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<ServiceRequestEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<ServiceRequestEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<ServiceRequestEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<ServiceRequestEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<ServiceRequestEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
