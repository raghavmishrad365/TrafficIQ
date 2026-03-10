import { SPECIALIST_DOMAINS } from "../services/agents/agentRegistry";

export interface D365Settings {
  foUrl: string;
  environment: string;
  legalEntity: string;
  enableMock: boolean;
}

export interface DataverseSettings {
  url: string;
  tenantId: string;
  clientId: string;
  syncOnStartup: boolean;
}

export interface EmailSettings {
  flowUrl: string;
  defaultRecipient: string;
  senderName: string;
  enableAlertEmails: boolean;
  enableShipmentEmails: boolean;
}

export interface IoTHubSettings {
  hostname: string;
  sasToken: string;
  enableMock: boolean;
}

export interface DataverseMcpSettings {
  mcpUrl: string;
  environmentUrl: string;
  enableMock: boolean;
  enableFieldService: boolean;
  enableScheduling: boolean;
  enableAssetManagement: boolean;
}

export interface AgentSettings {
  enabledAgents: Record<string, boolean>;
  modelOverrides: Record<string, string>;
  keywordAdditions: Record<string, string[]>;
  agentOrder: string[];
  defaultFallback: string;
  stickyMaxWords: number;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  enabledAgents: Object.fromEntries(SPECIALIST_DOMAINS.map(d => [d, true])),
  modelOverrides: {},
  keywordAdditions: {},
  agentOrder: [...SPECIALIST_DOMAINS],
  defaultFallback: "supplychain",
  stickyMaxWords: 6,
};

export const DEFAULT_D365_SETTINGS: D365Settings = {
  foUrl: "",
  environment: "",
  legalEntity: "USMF",
  enableMock: true,
};

export const DEFAULT_DATAVERSE_SETTINGS: DataverseSettings = {
  url: "",
  tenantId: "",
  clientId: "",
  syncOnStartup: true,
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  flowUrl: "",
  defaultRecipient: "",
  senderName: "TrafficIQ Alerts",
  enableAlertEmails: true,
  enableShipmentEmails: true,
};

export const DEFAULT_IOTHUB_SETTINGS: IoTHubSettings = {
  hostname: "",
  sasToken: "",
  enableMock: true,
};

export const DEFAULT_DATAVERSE_MCP_SETTINGS: DataverseMcpSettings = {
  mcpUrl: "",
  environmentUrl: "",
  enableMock: true,
  enableFieldService: true,
  enableScheduling: true,
  enableAssetManagement: true,
};
