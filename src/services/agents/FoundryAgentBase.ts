import { env } from "../../config/env";
import type { ChatMessage, ToolCallInfo } from "../../types/chat";
import type { OpenAIToolDefinition } from "../agentTools";

// --- Foundry Agent Service REST API types ---

export interface FoundryToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface FoundryRunStatus {
  id: string;
  status: "queued" | "in_progress" | "requires_action" | "completed" | "failed" | "cancelled" | "expired";
  required_action?: {
    type: "submit_tool_outputs";
    submit_tool_outputs: {
      tool_calls: FoundryToolCall[];
    };
  };
  last_error?: {
    code: string;
    message: string;
  };
}

interface FoundryMessageContent {
  type: "text" | "image_file";
  text?: { value: string; annotations: unknown[] };
  image_file?: { file_id: string };
}

interface FoundryMessage {
  id: string;
  role: "user" | "assistant";
  content: FoundryMessageContent[];
  created_at: number;
}

export type OnMessagesUpdate = (messages: ChatMessage[]) => void;
export type OnProcessingChange = (isProcessing: boolean) => void;

const API_VERSION = "2024-05-01-preview";
const POLL_INTERVAL_MS = 1000;

/**
 * Abstract base class for Foundry-based agents.
 * Encapsulates all Foundry REST API interactions (agents, threads, messages, runs).
 * Subclasses provide domain-specific instructions, tools, and tool execution.
 */
export abstract class FoundryAgentBase {
  protected agentId: string | null = null;
  protected threadId: string | null = null;
  protected initialized = false;

  /** Callback to notify UI when tool calls update on an assistant message */
  public onToolCallUpdate?: () => void;

  // --- Abstract methods subclasses must implement ---

  abstract getAgentName(): string;
  abstract getInstructions(): string;
  abstract getTools(): OpenAIToolDefinition[];
  abstract executeToolCall(name: string, argsJson: string): Promise<string>;

  // --- Environment helpers ---

  /**
   * Get the Azure OpenAI endpoint for the Assistants API.
   * Uses the cognitiveservices.azure.com endpoint which supports API key auth.
   * Falls back to deriving it from the project endpoint if VITE_AZURE_OPENAI_ENDPOINT is not set.
   */
  protected getOpenAIEndpoint(): string {
    // Prefer the explicit Azure OpenAI endpoint (supports api-key auth for Assistants API)
    if (env.azureOpenAIEndpoint) {
      return env.azureOpenAIEndpoint.replace(/\/$/, "");
    }
    // Fallback: derive from project endpoint by extracting the resource host
    const projectEndpoint = env.foundryProjectEndpoint || env.agentEndpoint;
    if (projectEndpoint) {
      try {
        const url = new URL(projectEndpoint);
        const resourceName = url.hostname.split(".")[0];
        return `https://${resourceName}.cognitiveservices.azure.com`;
      } catch {
        // fall through
      }
    }
    throw new Error(
      "Azure OpenAI endpoint not configured. Set VITE_AZURE_OPENAI_ENDPOINT in your .env file."
    );
  }

  protected getApiKey(): string {
    const key = env.foundryApiKey || env.azureOpenAIKey || env.agentApiKey;
    if (!key || key === "your-agent-api-key") {
      throw new Error(
        "API key not configured. Set VITE_FOUNDRY_API_KEY in your .env file."
      );
    }
    return key;
  }

  protected getModelDeployment(): string {
    return env.foundryModelDeployment || env.agentModelDeployment || "gpt-4o";
  }

  // --- Foundry REST API methods ---

  /**
   * Make authenticated request to Azure OpenAI Assistants API.
   * Uses the /openai/ route on the cognitiveservices endpoint which supports api-key auth.
   */
  protected async foundryFetch(
    path: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: unknown
  ): Promise<unknown> {
    const endpoint = this.getOpenAIEndpoint();
    const apiKey = this.getApiKey();
    // Prefix with /openai to use the Assistants API route (supports api-key auth)
    const openAIPath = `/openai${path}`;
    const url = `${endpoint}${openAIPath}${openAIPath.includes("?") ? "&" : "?"}api-version=${API_VERSION}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "api-key": apiKey,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Foundry API ${method} ${path} failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /** Create the agent (assistant) in Foundry using subclass-provided config */
  protected async createAgentOnFoundry(): Promise<string> {
    const result = await this.foundryFetch("/assistants", "POST", {
      model: this.getModelDeployment(),
      name: this.getAgentName(),
      instructions: this.getInstructions(),
      tools: this.getTools(),
    }) as { id: string };

    console.log(`[${this.getAgentName()}] Created agent: ${result.id}`);
    return result.id;
  }

  /** Create a new thread */
  protected async createThread(): Promise<string> {
    const result = await this.foundryFetch("/threads", "POST", {}) as { id: string };
    console.log(`[${this.getAgentName()}] Created thread: ${result.id}`);
    return result.id;
  }

  /** Add a message to the thread */
  protected async addMessage(threadId: string, role: "user", content: string): Promise<void> {
    await this.foundryFetch(`/threads/${threadId}/messages`, "POST", {
      role,
      content,
    });
  }

  /** Create a run for the thread */
  protected async createRun(threadId: string, agentId: string): Promise<FoundryRunStatus> {
    return await this.foundryFetch(`/threads/${threadId}/runs`, "POST", {
      assistant_id: agentId,
    }) as FoundryRunStatus;
  }

  /** Get run status */
  protected async getRun(threadId: string, runId: string): Promise<FoundryRunStatus> {
    return await this.foundryFetch(`/threads/${threadId}/runs/${runId}`) as FoundryRunStatus;
  }

  /** Submit tool outputs to a run */
  protected async submitToolOutputs(
    threadId: string,
    runId: string,
    toolOutputs: Array<{ tool_call_id: string; output: string }>
  ): Promise<FoundryRunStatus> {
    return await this.foundryFetch(
      `/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
      "POST",
      { tool_outputs: toolOutputs }
    ) as FoundryRunStatus;
  }

  /** Get messages from the thread */
  protected async getThreadMessages(threadId: string): Promise<FoundryMessage[]> {
    const result = await this.foundryFetch(`/threads/${threadId}/messages`) as { data: FoundryMessage[] };
    return result.data || [];
  }

  /** Poll for run completion, handling tool calls */
  protected async pollRun(
    threadId: string,
    runId: string,
    assistantMessage: ChatMessage
  ): Promise<void> {
    let run = await this.getRun(threadId, runId);

    while (
      run.status === "queued" ||
      run.status === "in_progress" ||
      run.status === "requires_action"
    ) {
      if (run.status === "requires_action" && run.required_action) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        console.log(`[${this.getAgentName()}] Tool calls:`, toolCalls.map(tc => tc.function.name).join(", "));

        const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments || "{}";

          // Update UI with tool call indicator
          const toolCallInfo: ToolCallInfo = {
            id: toolCall.id,
            name: toolName,
            arguments: toolArgs,
            status: "executing",
          };
          assistantMessage.toolCalls = [
            ...(assistantMessage.toolCalls || []),
            toolCallInfo,
          ];
          this.onToolCallUpdate?.();

          let toolResult: string;
          try {
            toolResult = await this.executeToolCall(toolName, toolArgs);
            toolCallInfo.status = "completed";
            toolCallInfo.result = toolResult;
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "Tool execution failed";
            toolResult = JSON.stringify({ error: errorMsg });
            toolCallInfo.status = "failed";
            toolCallInfo.result = toolResult;
          }
          this.onToolCallUpdate?.();

          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: toolResult,
          });
        }

        // Submit tool outputs and continue
        run = await this.submitToolOutputs(threadId, runId, toolOutputs);
      } else {
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        run = await this.getRun(threadId, runId);
      }
    }

    if (run.status === "failed") {
      throw new Error(
        `Agent run failed: ${run.last_error?.message || "Unknown error"}`
      );
    }

    if (run.status === "expired") {
      throw new Error("Agent run expired (10 minute timeout)");
    }

    console.log(`[${this.getAgentName()}] Run completed with status: ${run.status}`);
  }

  // --- Lifecycle methods ---

  /** Initialize — create agent on Foundry and first thread */
  async initialize(): Promise<void> {
    this.agentId = await this.createAgentOnFoundry();
    this.threadId = await this.createThread();
    this.initialized = true;
  }

  /**
   * Process a user message: send to Foundry thread, create run, poll for completion,
   * and return the assistant's response text. The assistantMessage object is mutated
   * in-place with tool call indicators for real-time UI updates.
   */
  async processMessage(content: string, assistantMessage: ChatMessage): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.agentId || !this.threadId) {
      throw new Error("Agent not initialized");
    }

    // Send message to Foundry thread
    await this.addMessage(this.threadId, "user", content);

    // Create a run
    const run = await this.createRun(this.threadId, this.agentId);
    console.log(`[${this.getAgentName()}] Created run: ${run.id}`);

    // Poll for completion, handling tool calls
    await this.pollRun(this.threadId, run.id, assistantMessage);

    // Fetch assistant's response from thread messages
    const threadMessages = await this.getThreadMessages(this.threadId);
    const latestAssistant = threadMessages.find(m => m.role === "assistant");

    if (latestAssistant) {
      const textContent = latestAssistant.content
        .filter(c => c.type === "text" && c.text)
        .map(c => c.text!.value)
        .join("\n");
      return textContent || "I processed your request.";
    }

    return "I processed your request.";
  }

  /** Start a new conversation thread (keep same agent) */
  async newThread(): Promise<void> {
    if (!this.agentId) {
      await this.initialize();
      return;
    }
    this.threadId = await this.createThread();
  }

  /** Clean up — delete agent and thread */
  async cleanup(): Promise<void> {
    try {
      if (this.threadId) {
        await this.foundryFetch(`/threads/${this.threadId}`, "DELETE").catch(() => {});
      }
      if (this.agentId) {
        await this.foundryFetch(`/assistants/${this.agentId}`, "DELETE").catch(() => {});
      }
    } catch {
      // Cleanup is best-effort
    }
    this.agentId = null;
    this.threadId = null;
    this.initialized = false;
  }

  isReady(): boolean {
    return this.initialized;
  }
}
