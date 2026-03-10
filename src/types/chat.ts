/** How a message was routed to its specialist agent */
export interface RoutingInfo {
  tier: 1 | 2 | 3;
  tierName: "sticky" | "keyword" | "llm";
  reason: string;
  fromAgent?: import("../services/agents/agentRegistry").AgentDomain;
  toAgent: import("../services/agents/agentRegistry").AgentDomain;
}

/** Per-agent activity state for the status strip */
export type AgentActivityState = "idle" | "routing" | "active" | "completed";

export interface AgentStatusInfo {
  domain: import("../services/agents/agentRegistry").AgentDomain;
  state: AgentActivityState;
  lastUsedAt?: string;
  toolsExecuted: number;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
  /** Which specialist agent handled this message */
  agentDomain?: import("../services/agents/agentRegistry").AgentDomain;
  /** Display name of the agent (e.g. "Traffic", "Supply Chain") */
  agentDisplayName?: string;
  /** How this message was routed to its agent */
  routingInfo?: RoutingInfo;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string;
  status: "pending" | "executing" | "completed" | "failed";
  result?: string;
}

export interface ChatThread {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatState {
  thread: ChatThread | null;
  isLoading: boolean;
  isAgentProcessing: boolean;
  error: string | null;
  agentId: string | null;
}

/** Layout modes for the chat panel */
export type ChatLayoutMode = "docked-right" | "docked-left" | "floating" | "expanded" | "minimized";

/** Persistent layout state for the chat panel */
export interface ChatPanelLayout {
  mode: ChatLayoutMode;
  floatX: number;
  floatY: number;
  floatWidth: number;
  floatHeight: number;
  previousMode: ChatLayoutMode;
}
