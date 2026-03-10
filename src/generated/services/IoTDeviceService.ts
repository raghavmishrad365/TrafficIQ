// =============================================================================
// Dataverse Service: IoTDeviceService
// Table: tiq_iotdevices
// Publisher: TrafficIQ (tiq)
// =============================================================================

import type { IoTDeviceEntity } from "../models/IoTDeviceModel";
import type { IGetAllOptions, IOperationResult } from "../types";

export class IoTDeviceService {
  private static readonly entitySetName = "tiq_iotdevices";

  static async create(
    record: Omit<IoTDeviceEntity, "tiq_iotdeviceid">
  ): Promise<IOperationResult<IoTDeviceEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.create<IoTDeviceEntity>(this.entitySetName, record);
  }

  static async get(id: string): Promise<IOperationResult<IoTDeviceEntity>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.get<IoTDeviceEntity>(this.entitySetName, id);
  }

  static async getAll(options?: IGetAllOptions): Promise<IOperationResult<IoTDeviceEntity[]>> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.getAll<IoTDeviceEntity>(this.entitySetName, options);
  }

  static async update(id: string, changes: Partial<IoTDeviceEntity>): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.update(this.entitySetName, id, changes);
  }

  static async delete(id: string): Promise<void> {
    const { DataverseClient } = await import("../../services/dataverseClient");
    return DataverseClient.delete(this.entitySetName, id);
  }
}
