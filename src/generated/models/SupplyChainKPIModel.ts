// =============================================================================
// Dataverse Table: tiq_supplychainkpi
// Display Name: Supply Chain KPI
// Description: Periodic supply chain KPI snapshots for analytics
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export interface SupplyChainKPIEntity {
  tiq_supplychainkpiid?: string;
  tiq_name: string;
  tiq_ontimedeliveryrate?: number;
  tiq_avgdeliverytimeminutes?: number;
  tiq_activeshipments?: number;
  tiq_delayedshipments?: number;
  tiq_costperkm?: number;
  tiq_slacompliancerate?: number;
  tiq_warehouseutilization?: number;
  tiq_fleetutilization?: number;
  tiq_totaldeliveriestoday?: number;
  tiq_pendingworkorders?: number;
  tiq_snapshottime: string;
  tiq_d365externalid?: string;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
