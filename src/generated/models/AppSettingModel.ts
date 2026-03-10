// =============================================================================
// Dataverse Table: tiq_appsetting
// Display Name: App Setting
// Description: Runtime application settings (no secrets)
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum SettingCategoryOption {
  General = 100480000,
  Map = 100480001,
  MCP = 100480002,
  Dataverse = 100480003,
  Email = 100480004,
  IoTHub = 100480005,
  Agents = 100480006,
}

export interface AppSettingEntity {
  tiq_appsettingid?: string;
  tiq_key: string;
  tiq_value?: string;
  tiq_category: SettingCategoryOption;
  tiq_displayname?: string;
  tiq_description?: string;
  tiq_issecret?: boolean;
  tiq_isactive?: boolean;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
