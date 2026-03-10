import { FoundryAgentBase } from "./FoundryAgentBase";
import type { OpenAIToolDefinition } from "../agentTools";
import type { AgentDomain } from "./agentRegistry";

export interface SpecialistConfig {
  domain: AgentDomain;
  name: string;
  instructions: string;
  tools: OpenAIToolDefinition[];
  toolExecutor: (name: string, argsJson: string) => Promise<string>;
}

/**
 * Concrete Foundry agent for a specific domain.
 * Created with a config containing domain-specific instructions, tools, and executor.
 */
export class SpecialistAgent extends FoundryAgentBase {
  readonly domain: AgentDomain;
  private config: SpecialistConfig;

  constructor(config: SpecialistConfig) {
    super();
    this.domain = config.domain;
    this.config = config;
  }

  getAgentName(): string {
    return this.config.name;
  }

  getInstructions(): string {
    return this.config.instructions;
  }

  getTools(): OpenAIToolDefinition[] {
    return this.config.tools;
  }

  async executeToolCall(name: string, argsJson: string): Promise<string> {
    return this.config.toolExecutor(name, argsJson);
  }

  /** Set the callback that fires when tool calls update (for real-time UI) */
  setToolCallUpdateCallback(cb: () => void): void {
    this.onToolCallUpdate = cb;
  }
}
