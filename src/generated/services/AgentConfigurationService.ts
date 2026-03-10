// =============================================================================
// Dataverse Service: AgentConfigurationService
// Table: tiq_agentconfigurations
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { AgentConfigurationEntity } from "../models/AgentConfigurationModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class AgentConfigurationService {
  private static readonly entitySetName = "tiq_agentconfigurations";

  static async create(
    record: Omit<AgentConfigurationEntity, "tiq_agentconfigurationid">
  ): Promise<IOperationResult<AgentConfigurationEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<AgentConfigurationEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<AgentConfigurationEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<AgentConfigurationEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<AgentConfigurationEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<AgentConfigurationEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<AgentConfigurationEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
