import { env } from "../config/env";
import { agentToolDefinitions, executeToolCall } from "./agentTools";
import type { OpenAIToolDefinition } from "./agentTools";
import type { ChatMessage, ToolCallInfo } from "../types/chat";
import { v4 as uuidv4 } from "uuid";

// --- Agent Instructions ---

const AGENT_INSTRUCTIONS = `You are TRAFI, the Supply Chain Transport Intelligence Assistant. You help logistics teams with real-time traffic intelligence, delivery route optimization, shipment tracking, and warehouse management — powered by D365 Finance & Operations and Azure Maps.

Your capabilities:

## Supply Chain & Logistics
1. **Warehouse shipments** - view pending/active shipments from D365 warehouses
2. **Delivery schedules** - check scheduled deliveries for date ranges
3. **Delivery route optimization** - plan optimal multi-stop delivery routes with traffic awareness
4. **Shipment status** - check real-time status of specific shipments
5. **ETA updates** - update shipment ETAs based on current traffic conditions
6. **Warehouse inventory** - check inventory levels at warehouses

## Traffic Intelligence
7. **Search locations** in Denmark - resolve place names to coordinates
8. **Plan journeys** - find best routes between locations with traffic-aware timing
9. **Check traffic** - get current incidents (accidents, roadwork, congestion) for any area
10. **Compare routes** - current traffic vs historical data for a route
11. **Monitor journeys** - real-time conditions check with incidents
12. **Suggest re-route** - find better alternatives when delays are detected

## Personal Commute (Employee Mode)
13. **Save journeys** - create and save favorite routes for quick access
14. **Manage saved journeys** - list, update, and delete saved routes
15. **Check commute status** - recommend leave now / wait / take alternative
16. **Get commute history** - past commute data & patterns

## App Navigation
17. **Navigate the app** - direct users to specific pages (dashboard, shipments, delivery-planner, journey-planner, saved-journeys, notifications, settings)

## Supply Chain Workflows

### Shipment Overview
When a user asks about shipments, deliveries, or warehouse logistics:
1. Use get_warehouse_shipments to fetch active shipments
2. Present shipment details with traffic status
3. Highlight any delayed shipments with traffic impact
4. Offer to optimize delivery routes if multiple shipments share a region

### Delivery Route Optimization
When a user asks to plan delivery routes or optimize deliveries:
1. Use get_warehouse_shipments to fetch pending deliveries
2. Use optimize_delivery_route to plan the optimal multi-stop route
3. Present the route with stop order, distances, ETAs, and traffic delays
4. Navigate to the delivery planner page to show the route on the map

### ETA Update Workflow
When a user asks to update ETAs or check delivery timing:
1. Use get_warehouse_shipments to get active shipments
2. For each shipment, use check_shipment_status to analyze traffic
3. Use update_shipment_eta to write updated ETAs back to D365
4. Summarize which ETAs changed and by how much

### Traffic Impact Analysis
When a user asks "how is traffic affecting our deliveries?":
1. Use get_warehouse_shipments to get all active shipments
2. Use get_traffic_incidents to check incidents near delivery corridors
3. Correlate incidents with shipment routes
4. Provide AI-powered summary of impact and recommendations

### Inventory Check
When a user asks about stock or inventory levels:
1. Use get_warehouse_inventory with the warehouse ID
2. Present inventory levels with key item details

## Journey Planning Workflow (Commute/Ad-hoc)
When a user asks to plan a journey, get traffic info between two places, or asks about routes:
1. Use search_location to resolve BOTH the origin and destination place names
2. Use plan_journey with the resolved coordinates
3. Optionally use get_traffic_incidents to check for incidents along the route area
4. Summarize the results including recommended route, delays, and incidents
5. Offer to save the journey if the user wants to reuse it later

## Create Journey Workflow
When a user asks to "create a journey", "save a route", "add a commute":
1. If origin and destination are NOT both provided, IMMEDIATELY call the **show_input_form** tool with a journey creation form.
2. If the user already provided both origin and destination, skip the form and proceed directly.
3. When the user submits the form:
   a. Use search_location to resolve both
   b. Use plan_journey to show the route
   c. Use save_journey with all details
   d. Confirm success

## Showing Forms with show_input_form Tool
ALWAYS use the **show_input_form** tool instead of asking questions in plain text.

### MANDATORY: When to use show_input_form:
- **Journey creation** - collect origin, destination, name, transport mode
- **Disambiguation / multiple results** - when search_location returns multiple results
- **Confirmation** - before saving or deleting, show a confirm/cancel card
- **Yes/No questions** - show a card with Yes/No buttons
- **Any question to the user** - use a form card

### NEVER do this:
- NEVER ask questions in plain text like "Could you clarify...?"
- NEVER list options as numbered text
- NEVER ask the user to "confirm" by typing yes/no

### How to call the tool:
- **title**: A short title for the form
- **card**: An Adaptive Card object with \`"type": "AdaptiveCard"\`, \`"version": "1.5"\`, a \`body\` array, and an \`actions\` array

## App Navigation
When the user wants to see a specific page, use navigate_to_page:
- "Show shipments" → navigate to shipments
- "Open delivery planner" → navigate to delivery-planner
- "Show me the dashboard" → navigate to dashboard
- "Open saved journeys" → navigate to saved-journeys
- "Go to settings" → navigate to settings

## Guidelines
- Always search_location FIRST to resolve place names before planning journeys
- The plan_journey tool automatically opens the Journey Planner page with routes on the map
- Provide distances in km and durations in minutes/hours
- Mention traffic delays and incidents when relevant
- Respond in the same language the user writes in (Danish or English)
- Be concise but informative
- CRITICAL: NEVER ask the user questions in plain text. ALWAYS use show_input_form.
- Copenhagen bounding box: north=55.73, south=55.63, east=12.65, west=12.48
- Aarhus bounding box: north=56.19, south=56.12, east=10.25, west=10.15
- Odense bounding box: north=55.42, south=55.37, east=10.43, west=10.35`;

// --- Foundry Agent Service REST API types ---

interface FoundryToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface FoundryRunStatus {
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

// --- Service class ---

export type OnMessagesUpdate = (messages: ChatMessage[]) => void;
export type OnProcessingChange = (isProcessing: boolean) => void;

const API_VERSION = "2025-05-01";
const POLL_INTERVAL_MS = 1000;

class FoundryAgentService {
  private agentId: string | null = null;
  private threadId: string | null = null;
  private messages: ChatMessage[] = [];
  private initialized = false;

  private onMessagesUpdate: OnMessagesUpdate | null = null;
  private onProcessingChange: OnProcessingChange | null = null;

  setCallbacks(
    onMessages: OnMessagesUpdate,
    onProcessing: OnProcessingChange
  ) {
    this.onMessagesUpdate = onMessages;
    this.onProcessingChange = onProcessing;
  }

  private notifyMessages() {
    this.onMessagesUpdate?.([...this.messages]);
  }

  private notifyProcessing(state: boolean) {
    this.onProcessingChange?.(state);
  }

  private getProjectEndpoint(): string {
    const endpoint = env.foundryProjectEndpoint || env.agentEndpoint;
    if (!endpoint) {
      throw new Error(
        "Foundry project endpoint not configured. Set VITE_FOUNDRY_PROJECT_ENDPOINT in your .env file."
      );
    }
    return endpoint.replace(/\/$/, "");
  }

  private getApiKey(): string {
    const key = env.foundryApiKey || env.azureOpenAIKey || env.agentApiKey;
    if (!key || key === "your-agent-api-key") {
      throw new Error(
        "API key not configured. Set VITE_FOUNDRY_API_KEY in your .env file."
      );
    }
    return key;
  }

  private getModelDeployment(): string {
    return env.foundryModelDeployment || env.agentModelDeployment || "gpt-4o";
  }

  /** Make authenticated request to Foundry Agent Service */
  private async foundryFetch(
    path: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: unknown
  ): Promise<unknown> {
    const endpoint = this.getProjectEndpoint();
    const apiKey = this.getApiKey();
    const url = `${endpoint}${path}${path.includes("?") ? "&" : "?"}api-version=${API_VERSION}`;

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

  /** Create the agent (assistant) in Foundry */
  private async createAgent(): Promise<string> {
    const toolDefs = agentToolDefinitions as OpenAIToolDefinition[];
    const result = await this.foundryFetch("/assistants", "POST", {
      model: this.getModelDeployment(),
      name: "TrafficIQ Supply Chain Assistant",
      instructions: AGENT_INSTRUCTIONS,
      tools: toolDefs,
    }) as { id: string };

    console.log(`[FoundryAgent] Created agent: ${result.id}`);
    return result.id;
  }

  /** Create a new thread */
  private async createThread(): Promise<string> {
    const result = await this.foundryFetch("/threads", "POST", {}) as { id: string };
    console.log(`[FoundryAgent] Created thread: ${result.id}`);
    return result.id;
  }

  /** Add a message to the thread */
  private async addMessage(threadId: string, role: "user", content: string): Promise<void> {
    await this.foundryFetch(`/threads/${threadId}/messages`, "POST", {
      role,
      content,
    });
  }

  /** Create a run for the thread */
  private async createRun(threadId: string, agentId: string): Promise<FoundryRunStatus> {
    return await this.foundryFetch(`/threads/${threadId}/runs`, "POST", {
      assistant_id: agentId,
    }) as FoundryRunStatus;
  }

  /** Get run status */
  private async getRun(threadId: string, runId: string): Promise<FoundryRunStatus> {
    return await this.foundryFetch(`/threads/${threadId}/runs/${runId}`) as FoundryRunStatus;
  }

  /** Submit tool outputs to a run */
  private async submitToolOutputs(
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
  private async getThreadMessages(threadId: string): Promise<FoundryMessage[]> {
    const result = await this.foundryFetch(`/threads/${threadId}/messages`) as { data: FoundryMessage[] };
    return result.data || [];
  }

  /** Poll for run completion, handling tool calls */
  private async pollRun(
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
        console.log("[FoundryAgent] Tool calls:", toolCalls.map(tc => tc.function.name).join(", "));

        const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments || "{}";

          // Update UI
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
          this.notifyMessages();

          let toolResult: string;
          try {
            toolResult = await executeToolCall(toolName, toolArgs);
            toolCallInfo.status = "completed";
            toolCallInfo.result = toolResult;
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "Tool execution failed";
            toolResult = JSON.stringify({ error: errorMsg });
            toolCallInfo.status = "failed";
            toolCallInfo.result = toolResult;
          }
          this.notifyMessages();

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

    console.log(`[FoundryAgent] Run completed with status: ${run.status}`);
  }

  /** Initialize - create agent and first thread */
  async initialize(): Promise<void> {
    this.agentId = await this.createAgent();
    this.threadId = await this.createThread();
    this.messages = [];
    this.initialized = true;
    this.notifyMessages();
  }

  /** Send a user message and get the agent's response */
  async sendMessage(content: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.agentId || !this.threadId) {
      throw new Error("Agent not initialized");
    }

    // Add user message to local UI state
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(userMessage);
    this.notifyMessages();

    // Add a placeholder assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
      toolCalls: [],
    };
    this.messages.push(assistantMessage);
    this.notifyMessages();
    this.notifyProcessing(true);

    try {
      // Add message to Foundry thread
      await this.addMessage(this.threadId, "user", content);

      // Create a run
      const run = await this.createRun(this.threadId, this.agentId);
      console.log(`[FoundryAgent] Created run: ${run.id}`);

      // Poll for completion, handling tool calls
      await this.pollRun(this.threadId, run.id, assistantMessage);

      // Fetch assistant's response from thread messages
      const threadMessages = await this.getThreadMessages(this.threadId);
      // Get the latest assistant message (messages are returned newest first)
      const latestAssistant = threadMessages.find(m => m.role === "assistant");

      if (latestAssistant) {
        const textContent = latestAssistant.content
          .filter(c => c.type === "text" && c.text)
          .map(c => c.text!.value)
          .join("\n");
        assistantMessage.content = textContent || "I processed your request.";
      } else {
        assistantMessage.content = "I processed your request.";
      }

      console.log("[FoundryAgent] Final response:", assistantMessage.content.slice(0, 150));
      assistantMessage.isStreaming = false;
      this.notifyMessages();
    } catch (error) {
      assistantMessage.content = `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`;
      assistantMessage.isStreaming = false;
      this.notifyMessages();
    } finally {
      this.notifyProcessing(false);
    }
  }

  /** Start a new conversation thread (keep same agent) */
  async newThread(): Promise<void> {
    if (!this.agentId) {
      await this.initialize();
      return;
    }
    this.threadId = await this.createThread();
    this.messages = [];
    this.notifyMessages();
  }

  /** Clean up - delete agent and thread */
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
    this.messages = [];
    this.initialized = false;
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const foundryAgentService = new FoundryAgentService();
