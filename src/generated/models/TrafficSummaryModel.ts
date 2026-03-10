// =============================================================================
// Dataverse Table: tiq_trafficsummary
// Display Name: Traffic Summary
// Description: Periodic traffic summary snapshots
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface TrafficSummaryRecord {
  tiq_trafficsummaryid?: string;
  tiq_name: string;
  tiq_totalincidents: number;
  tiq_criticalincidents?: number;
  tiq_averagedelay?: number;
  tiq_congestionlevel: CongestionLevel;
  tiq_snapshottime: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}

export enum CongestionLevel {
  Free = 100480000,
  Light = 100480001,
  Moderate = 100480002,
  Heavy = 100480003,
  Severe = 100480004,
}

export const CongestionLevelLabels: Record<CongestionLevel, string> = {
  [CongestionLevel.Free]: "Free",
  [CongestionLevel.Light]: "Light",
  [CongestionLevel.Moderate]: "Moderate",
  [CongestionLevel.Heavy]: "Heavy",
  [CongestionLevel.Severe]: "Severe",
};
