// =============================================================================
// Dataverse Table: tiq_chatthread
// Display Name: Chat Thread
// Description: AI chat conversation threads for multi-agent orchestrator
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

export enum AgentDomainOption {
  Traffic = 100480000,
  SupplyChain = 100480001,
  Fleet = 100480002,
  Operations = 100480003,
  FieldService = 100480004,
  IoTLogistics = 100480005,
}

export interface ChatThreadRecord {
  tiq_chatthreadid?: string;
  tiq_name: string;
  tiq_externalthreadid?: string;
  tiq_agentid?: string;
  tiq_agentdomain?: AgentDomainOption;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}
