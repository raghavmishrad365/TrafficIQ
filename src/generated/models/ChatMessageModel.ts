// =============================================================================
// Dataverse Table: tiq_chatmessage
// Display Name: Chat Message
// Description: Individual chat messages within threads
// Publisher Prefix: tiq (TrafficIQ)
// =============================================================================

import { AgentDomainOption } from "./ChatThreadModel";

export interface ChatMessageRecord {
  tiq_chatmessageid?: string;
  tiq_preview: string;

  /** Lookup: Chat Thread ID */
  "tiq_chatthreadid@odata.bind"?: string;
  _tiq_chatthreadid_value?: string;

  tiq_role: ChatRole;
  tiq_content: string;
  tiq_toolcalls?: string;
  tiq_routedtoagent?: AgentDomainOption;
  tiq_messageorder: number;

  // System
  _ownerid_value?: string;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}

export enum ChatRole {
  User = 100480000,
  Assistant = 100480001,
  System = 100480002,
}

export const ChatRoleLabels: Record<ChatRole, string> = {
  [ChatRole.User]: "User",
  [ChatRole.Assistant]: "Assistant",
  [ChatRole.System]: "System",
};
