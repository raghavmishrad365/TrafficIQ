// =============================================================================
// Dataverse Table: tiq_userpreference
// Display Name: User Preference
// Description: Per-user notification and app preferences
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum ThemeModeOption {
  Light = 100480000,
  Dark = 100480001,
  System = 100480002,
}

export interface UserPreferenceEntity {
  tiq_userpreferenceid: string;
  tiq_name: string;
  tiq_pushenabled: boolean;
  tiq_emailenabled: boolean;
  tiq_emailaddress?: string;
  tiq_toastenabled: boolean;
  tiq_morningalerttime?: string;
  tiq_morningalertdays?: string;
  tiq_thememode?: ThemeModeOption;
  tiq_maplanguage?: string;
  tiq_mapstyle?: string;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
