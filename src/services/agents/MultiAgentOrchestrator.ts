import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, RoutingInfo, AgentStatusInfo } from "../../types/chat";
import type { OnMessagesUpdate, OnProcessingChange } from "./FoundryAgentBase";
import { FoundryAgentBase } from "./FoundryAgentBase";
import { SpecialistAgent } from "./SpecialistAgent";
import {
  type AgentDomain,
  AGENT_CONFIGS,
  SPECIALIST_DOMAINS,
  STICKY_PATTERNS,
  FORM_SUBMISSION_PATTERNS,
  STICKY_MAX_WORDS,
} from "./agentRegistry";
import type { OpenAIToolDefinition } from "../agentTools";

// Prompts
import { TRAFFIC_AGENT_PROMPT } from "./prompts/trafficPrompt";
import { SUPPLY_CHAIN_AGENT_PROMPT } from "./prompts/supplyChainPrompt";
import { FLEET_AGENT_PROMPT } from "./prompts/fleetPrompt";
import { OPERATIONS_AGENT_PROMPT } from "./prompts/operationsPrompt";
import { FIELD_SERVICE_AGENT_PROMPT } from "./prompts/fieldServicePrompt";
import { IOT_LOGISTICS_AGENT_PROMPT } from "./prompts/iotLogisticsPrompt";
import { ORCHESTRATOR_PROMPT } from "./prompts/orchestratorPrompt";

// Tool definitions & executors
import { trafficToolDefinitions, executeTrafficTool } from "./tools/trafficTools";
import { supplyChainToolDefinitions, executeSupplyChainTool } from "./tools/supplyChainTools";
import { fleetToolDefinitions, executeFleetTool } from "./tools/fleetTools";
import { operationsToolDefinitions, executeOperationsTool } from "./tools/operationsTools";
import { fieldServiceToolDefinitions, executeFieldServiceTool } from "./tools/fieldServiceTools";
import { iotLogisticsToolDefinitions, executeIoTLogisticsTool } from "./tools/iotLogisticsTools";

// --- Router Agent (lightweight Foundry agent for LLM-based routing) ---

const ROUTER_TOOL: OpenAIToolDefinition = {
  type: "function",
  function: {
    name: "route_to_agent",
    description: "Route the user's message to the best specialist agent.",
    parameters: {
      type: "object",
      properties: {
        agent: {
          type: "string",
          enum: ["traffic", "supplychain", "fleet", "operations", "fieldservice", "iotlogistics"],
          description: "The specialist agent domain to route to",
        },
        reason: {
          type: "string",
          description: "Brief reason for the routing decision",
        },
      },
      required: ["agent", "reason"],
    },
  },
};

class RouterAgent extends FoundryAgentBase {
  getAgentName(): string { return "TrafficIQ Router"; }
  getInstructions(): string { return ORCHESTRATOR_PROMPT; }
  getTools(): OpenAIToolDefinition[] { return [ROUTER_TOOL]; }

  private routeResult: AgentDomain | null = null;

  async executeToolCall(name: string, argsJson: string): Promise<string> {
    if (name === "route_to_agent") {
      const args = JSON.parse(argsJson);
      this.routeResult = args.agent as AgentDomain;
      console.log(`[Router] Routing to ${args.agent}: ${args.reason}`);
      return JSON.stringify({ routed: true, agent: args.agent });
    }
    return JSON.stringify({ error: "Unknown router tool" });
  }

  getRouteResult(): AgentDomain | null {
    return this.routeResult;
  }

  resetRouteResult(): void {
    this.routeResult = null;
  }
}

// --- Domain config lookup ---

const DOMAIN_PROMPTS: Record<Exclude<AgentDomain, "orchestrator">, string> = {
  traffic: TRAFFIC_AGENT_PROMPT,
  supplychain: SUPPLY_CHAIN_AGENT_PROMPT,
  fleet: FLEET_AGENT_PROMPT,
  operations: OPERATIONS_AGENT_PROMPT,
  fieldservice: FIELD_SERVICE_AGENT_PROMPT,
  iotlogistics: IOT_LOGISTICS_AGENT_PROMPT,
};

const DOMAIN_TOOLS: Record<Exclude<AgentDomain, "orchestrator">, OpenAIToolDefinition[]> = {
  traffic: trafficToolDefinitions,
  supplychain: supplyChainToolDefinitions,
  fleet: fleetToolDefinitions,
  operations: operationsToolDefinitions,
  fieldservice: fieldServiceToolDefinitions,
  iotlogistics: iotLogisticsToolDefinitions,
};

const DOMAIN_EXECUTORS: Record<Exclude<AgentDomain, "orchestrator">, (name: string, args: string) => Promise<string>> = {
  traffic: executeTrafficTool,
  supplychain: executeSupplyChainTool,
  fleet: executeFleetTool,
  operations: executeOperationsTool,
  fieldservice: executeFieldServiceTool,
  iotlogistics: executeIoTLogisticsTool,
};

// --- Multi-Agent Orchestrator ---

class MultiAgentOrchestrator {
  private agents = new Map<string, SpecialistAgent>();
  private routerAgent: RouterAgent | null = null;
  private activeAgent: AgentDomain | null = null;
  private messages: ChatMessage[] = [];
  private agentStatuses = new Map<string, AgentStatusInfo>();

  private onMessagesUpdate: OnMessagesUpdate | null = null;
  private onProcessingChange: OnProcessingChange | null = null;
  private onAgentStatusChange: ((statuses: AgentStatusInfo[]) => void) | null = null;

  /** Same API as foundryAgentService */
  setCallbacks(
    onMessages: OnMessagesUpdate,
    onProcessing: OnProcessingChange,
    onAgentStatus?: (statuses: AgentStatusInfo[]) => void
  ) {
    this.onMessagesUpdate = onMessages;
    this.onProcessingChange = onProcessing;
    this.onAgentStatusChange = onAgentStatus || null;
  }

  private notifyMessages() {
    this.onMessagesUpdate?.([...this.messages]);
  }

  private notifyProcessing(state: boolean) {
    this.onProcessingChange?.(state);
  }

  /** Initialize all agent statuses to idle */
  private initAgentStatuses(): void {
    for (const domain of SPECIALIST_DOMAINS) {
      if (!this.agentStatuses.has(domain)) {
        this.agentStatuses.set(domain, {
          domain,
          state: "idle",
          toolsExecuted: 0,
          messageCount: 0,
        });
      }
    }
  }

  /** Update a single agent's status and notify UI */
  private updateAgentStatus(domain: string, patch: Partial<AgentStatusInfo>): void {
    const current = this.agentStatuses.get(domain);
    if (current) {
      Object.assign(current, patch);
      this.notifyAgentStatuses();
    }
  }

  /** Notify UI of current agent statuses */
  private notifyAgentStatuses(): void {
    this.onAgentStatusChange?.(Array.from(this.agentStatuses.values()));
  }

  /** Public getter for agent statuses */
  getAgentStatuses(): AgentStatusInfo[] {
    this.initAgentStatuses();
    return Array.from(this.agentStatuses.values());
  }

  /** Get or lazily create a specialist agent for a domain */
  private async getOrCreateAgent(domain: Exclude<AgentDomain, "orchestrator">): Promise<SpecialistAgent> {
    if (this.agents.has(domain)) {
      return this.agents.get(domain)!;
    }

    const config = AGENT_CONFIGS[domain];
    const agent = new SpecialistAgent({
      domain,
      name: config.name,
      instructions: DOMAIN_PROMPTS[domain],
      tools: DOMAIN_TOOLS[domain],
      toolExecutor: DOMAIN_EXECUTORS[domain],
    });

    // Wire tool call updates to UI notification
    agent.setToolCallUpdateCallback(() => this.notifyMessages());

    console.log(`[Orchestrator] Initializing ${config.displayName} agent...`);
    await agent.initialize();
    this.agents.set(domain, agent);
    console.log(`[Orchestrator] ${config.displayName} agent ready.`);

    return agent;
  }

  /** Get or lazily create the router agent */
  private async getOrCreateRouter(): Promise<RouterAgent> {
    if (this.routerAgent) return this.routerAgent;

    this.routerAgent = new RouterAgent();
    this.routerAgent.onToolCallUpdate = () => {}; // suppress UI for router
    console.log("[Orchestrator] Initializing router agent...");
    await this.routerAgent.initialize();
    console.log("[Orchestrator] Router agent ready.");
    return this.routerAgent;
  }

  // --- Three-tier routing ---

  /** Tier 1: Sticky routing — continue same agent for follow-ups */
  private tryStickyRoute(message: string): AgentDomain | null {
    if (!this.activeAgent) return null;

    // Check follow-up patterns
    for (const pattern of STICKY_PATTERNS) {
      if (pattern.test(message)) return this.activeAgent;
    }

    // Check form submissions
    for (const pattern of FORM_SUBMISSION_PATTERNS) {
      if (pattern.test(message)) return this.activeAgent;
    }

    // Short messages (< N words) are likely follow-ups
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount <= STICKY_MAX_WORDS) return this.activeAgent;

    return null;
  }

  /** Tier 2: Keyword-based routing — fast deterministic matching */
  private tryKeywordRoute(message: string): AgentDomain | null {
    const lower = message.toLowerCase();
    const scores: Record<string, number> = {};

    for (const domain of SPECIALIST_DOMAINS) {
      const config = AGENT_CONFIGS[domain];
      let score = 0;
      for (const keyword of config.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          // Longer keywords get higher weight
          score += keyword.length > 8 ? 3 : keyword.length > 4 ? 2 : 1;
        }
      }
      if (score > 0) scores[domain] = score;
    }

    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;

    // Unambiguous: clear winner with >50% lead over second place
    if (entries.length === 1) return entries[0][0] as AgentDomain;
    if (entries[0][1] > entries[1][1] * 1.5) return entries[0][0] as AgentDomain;

    return null; // Ambiguous — fall through to LLM router
  }

  /** Tier 3: LLM router — Foundry agent classifies intent */
  private async llmRoute(message: string): Promise<AgentDomain> {
    try {
      const router = await this.getOrCreateRouter();
      router.resetRouteResult();

      // Use a dummy assistantMessage (router UI is suppressed)
      const dummyMsg: ChatMessage = { id: "router", role: "assistant", content: "", timestamp: new Date().toISOString(), toolCalls: [] };
      await router.processMessage(message, dummyMsg);

      const result = router.getRouteResult();
      if (result && SPECIALIST_DOMAINS.includes(result as Exclude<AgentDomain, "orchestrator">)) {
        return result;
      }
    } catch (error) {
      console.warn("[Orchestrator] LLM router failed, falling back to supplychain:", error);
    }

    // Default fallback
    return "supplychain";
  }

  /** Route a message through the three-tier cascade */
  private async route(message: string): Promise<{ domain: Exclude<AgentDomain, "orchestrator">; routingInfo: RoutingInfo }> {
    const fromAgent = this.activeAgent && this.activeAgent !== "orchestrator" ? this.activeAgent : undefined;

    // Tier 1: Sticky
    const sticky = this.tryStickyRoute(message);
    if (sticky && sticky !== "orchestrator") {
      const domain = sticky as Exclude<AgentDomain, "orchestrator">;
      console.log(`[Orchestrator] Tier 1 sticky → ${domain}`);
      return {
        domain,
        routingInfo: { tier: 1, tierName: "sticky", reason: this.getStickyReason(message), fromAgent, toAgent: domain },
      };
    }

    // Tier 2: Keyword
    const keyword = this.tryKeywordRoute(message);
    if (keyword && keyword !== "orchestrator") {
      const domain = keyword as Exclude<AgentDomain, "orchestrator">;
      const matched = this.getMatchedKeywords(message, domain);
      console.log(`[Orchestrator] Tier 2 keyword → ${domain}`);
      return {
        domain,
        routingInfo: { tier: 2, tierName: "keyword", reason: `Matched: ${matched.slice(0, 3).join(", ")}`, fromAgent, toAgent: domain },
      };
    }

    // Tier 3: LLM Router
    console.log("[Orchestrator] Tier 3 LLM router...");
    const llm = await this.llmRoute(message);
    const domain = llm as Exclude<AgentDomain, "orchestrator">;
    console.log(`[Orchestrator] Tier 3 LLM → ${domain}`);
    return {
      domain,
      routingInfo: { tier: 3, tierName: "llm", reason: "AI classified", fromAgent, toAgent: domain },
    };
  }

  /** Get human-readable reason for sticky routing */
  private getStickyReason(message: string): string {
    for (const pattern of STICKY_PATTERNS) {
      if (pattern.test(message)) return "Follow-up detected";
    }
    for (const pattern of FORM_SUBMISSION_PATTERNS) {
      if (pattern.test(message)) return "Form submission";
    }
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount <= STICKY_MAX_WORDS) return `Short follow-up (${wordCount} words)`;
    return "Continuation";
  }

  /** Get the keywords that matched for a domain */
  private getMatchedKeywords(message: string, domain: Exclude<AgentDomain, "orchestrator">): string[] {
    const lower = message.toLowerCase();
    const config = AGENT_CONFIGS[domain];
    return config.keywords.filter(k => lower.includes(k.toLowerCase()));
  }

  /** Build context summary from recent messages for agent handoff */
  private buildContextSummary(): string {
    const recentMessages = this.messages.slice(-6); // last 3 exchanges max
    if (recentMessages.length === 0) return "";

    const lines = recentMessages.map(m => {
      const role = m.role === "user" ? "User" : `Assistant (${m.agentDisplayName || "TRAFI"})`;
      const content = m.content.slice(0, 200);
      return `${role}: ${content}`;
    });

    return `[Context from previous conversation]\n${lines.join("\n")}\n[End context]\n\n`;
  }

  // --- Public API (matches foundryAgentService interface) ---

  /** Send a user message — routes to the right specialist and returns response */
  async sendMessage(content: string): Promise<void> {
    // Add user message to unified list
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(userMessage);
    this.notifyMessages();
    this.notifyProcessing(true);

    this.initAgentStatuses();

    // Route to the right domain
    const { domain: targetDomain, routingInfo } = await this.route(content);
    const isHandoff = this.activeAgent !== null && this.activeAgent !== targetDomain;
    const config = AGENT_CONFIGS[targetDomain];

    // Update agent statuses
    if (this.activeAgent && this.activeAgent !== targetDomain && this.activeAgent !== "orchestrator") {
      this.updateAgentStatus(this.activeAgent, { state: "completed" });
    }
    this.updateAgentStatus(targetDomain, { state: "active" });

    // Create placeholder assistant message with domain info
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
      toolCalls: [],
      agentDomain: targetDomain,
      agentDisplayName: config.displayName,
      routingInfo,
    };
    this.messages.push(assistantMessage);
    this.notifyMessages();

    try {
      // Get/create the specialist agent
      const agent = await this.getOrCreateAgent(targetDomain);

      // On handoff, prepend context summary
      let messageToSend = content;
      if (isHandoff) {
        const ctx = this.buildContextSummary();
        if (ctx) {
          messageToSend = ctx + content;
        }
      }

      // Process message through the specialist
      const responseText = await agent.processMessage(messageToSend, assistantMessage);

      assistantMessage.content = responseText;
      assistantMessage.isStreaming = false;
      this.activeAgent = targetDomain;

      // Update agent status counts
      const status = this.agentStatuses.get(targetDomain);
      if (status) {
        status.messageCount += 1;
        status.toolsExecuted += (assistantMessage.toolCalls?.length || 0);
        status.lastUsedAt = new Date().toISOString();
        status.state = "completed";
        this.notifyAgentStatuses();
      }

      this.notifyMessages();

      console.log(`[Orchestrator] Response from ${config.displayName}:`, responseText.slice(0, 150));
    } catch (error) {
      assistantMessage.content = `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`;
      assistantMessage.isStreaming = false;
      this.updateAgentStatus(targetDomain, { state: "idle" });
      this.notifyMessages();
    } finally {
      this.notifyProcessing(false);
    }
  }

  /** Initialize — no-op (agents are lazily initialized) */
  async initialize(): Promise<void> {
    // Agents are created lazily on first use
    console.log("[Orchestrator] Ready (agents will be created on first use).");
  }

  /** Start a new conversation — reset all specialist threads */
  async newConversation(): Promise<void> {
    // Create new threads for all active agents
    const promises: Promise<void>[] = [];
    for (const agent of this.agents.values()) {
      promises.push(agent.newThread());
    }
    if (this.routerAgent) {
      promises.push(this.routerAgent.newThread());
    }
    await Promise.all(promises);

    this.messages = [];
    this.activeAgent = null;
    this.agentStatuses.clear();
    this.notifyMessages();
    this.notifyAgentStatuses();
  }

  /** Clean up all agents */
  async cleanup(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const agent of this.agents.values()) {
      promises.push(agent.cleanup());
    }
    if (this.routerAgent) {
      promises.push(this.routerAgent.cleanup());
    }
    await Promise.all(promises);

    this.agents.clear();
    this.routerAgent = null;
    this.messages = [];
    this.activeAgent = null;
  }

  /** Get the currently active agent domain */
  getActiveAgent(): AgentDomain | null {
    return this.activeAgent;
  }

  /** Get current messages */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  isInitialized(): boolean {
    return true; // Orchestrator is always "initialized" — agents are lazy
  }
}

/** Singleton orchestrator instance */
export const multiAgentOrchestrator = new MultiAgentOrchestrator();
