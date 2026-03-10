// =============================================================================
// Dataverse Table: tiq_agentconfiguration
// Display Name: Agent Configuration
// Description: Per-agent settings for the multi-agent orchestrator
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

import { AgentDomainOption } from "./ChatThreadModel";

export { AgentDomainOption };

export interface AgentConfigurationEntity {
  tiq_agentconfigurationid?: string;
  tiq_name: string;
  tiq_domain: AgentDomainOption;
  tiq_subtitle?: string;
  tiq_color?: string;
  tiq_isenabled?: boolean;
  tiq_modeldeployment?: string;
  tiq_foundryagentid?: string;
  tiq_keywords?: string;
  tiq_tools?: string;
  tiq_systemprompt?: string;
  tiq_sortorder?: number;

  // System
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
}
