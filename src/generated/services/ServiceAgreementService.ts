// =============================================================================
// Dataverse Service: ServiceAgreementService
// Table: tiq_serviceagreements
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { ServiceAgreementEntity } from "../models/ServiceAgreementModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class ServiceAgreementService {
  private static readonly entitySetName = "tiq_serviceagreements";

  static async create(
    record: Omit<ServiceAgreementEntity, "tiq_serviceagreementid">
  ): Promise<IOperationResult<ServiceAgreementEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<ServiceAgreementEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<ServiceAgreementEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<ServiceAgreementEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<ServiceAgreementEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<ServiceAgreementEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<ServiceAgreementEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
