// =============================================================================
// Dataverse Service: NotificationDataService
// Table: tiq_notification
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { NotificationEntity } from "../models/NotificationModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class NotificationDataService {
  private static readonly entitySetName = "tiq_notifications";

  static async create(
    record: Omit<NotificationEntity, "tiq_notificationid">
  ): Promise<IOperationResult<NotificationEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<NotificationEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<NotificationEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<NotificationEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<NotificationEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<NotificationEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<NotificationEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
