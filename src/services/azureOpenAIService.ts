import { env } from "../config/env";
import type { TrafficIncident } from "../types/traffic";
import type { SavedJourney } from "../types/journey";

/**
 * Azure OpenAI service using the Foundry project endpoint.
 * Provides non-agentic chat completions for quick prompts
 * such as morning briefings and traffic summaries.
 *
 * Uses the Azure OpenAI-compatible REST API exposed by AI Foundry:
 *   POST {foundryEndpoint}/openai/deployments/{model}/chat/completions
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

class AzureOpenAIService {
  private getEndpoint(): string {
    // Prefer dedicated Azure OpenAI endpoint, fall back to Foundry agent endpoint
    let endpoint = env.azureOpenAIEndpoint || env.agentEndpoint;
    if (!endpoint) throw new Error("No Azure OpenAI or Foundry endpoint configured");

    // Strip any path after the host if the user configured the full URL
    const openAiPathIndex = endpoint.indexOf("/openai/");
    if (openAiPathIndex !== -1) {
      endpoint = endpoint.substring(0, openAiPathIndex);
    }
    return endpoint.replace(/\/$/, "");
  }

  private getApiKey(): string | null {
    const dedicated = env.azureOpenAIKey;
    if (dedicated) return dedicated;
    const apiKey = env.agentApiKey;
    if (apiKey && apiKey !== "your-agent-api-key") return apiKey;
    return null;
  }

  private getDeployment(): string {
    return env.azureOpenAIDeployment || env.agentModelDeployment || "gpt-4o";
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = this.getApiKey();
    if (apiKey) {
      headers["api-key"] = apiKey;
    }

    return headers;
  }

  /**
   * Send a chat completion request to the Azure OpenAI deployment on Foundry.
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const deployment = this.getDeployment();
    const endpoint = this.getEndpoint();
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Azure OpenAI request failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices[0]?.message?.content ?? "";
  }

  /**
   * Generate a concise traffic summary from a list of incidents.
   */
  async getTrafficSummary(incidents: TrafficIncident[]): Promise<string> {
    if (incidents.length === 0) {
      return "No active traffic incidents. Roads are clear.";
    }

    const incidentList = incidents
      .slice(0, 15)
      .map((i) => `- [${i.severity}] ${i.type}: ${i.title} on ${i.roadName || "unknown road"} (${i.delayMinutes}min delay)`)
      .join("\n");

    return this.chatCompletion([
      {
        role: "system",
        content:
          "You are a traffic analyst. Summarize the traffic situation concisely in 2-3 sentences. Mention the most critical incidents and overall travel conditions. Be direct and useful for commuters.",
      },
      {
        role: "user",
        content: `Current traffic incidents:\n${incidentList}\n\nTotal incidents: ${incidents.length}`,
      },
    ], { temperature: 0.3, maxTokens: 256 });
  }

  /**
   * Generate a morning commute briefing for a user's saved journeys.
   */
  async getMorningBriefing(
    journeys: SavedJourney[],
    incidentsByJourney: Map<string, TrafficIncident[]>
  ): Promise<string> {
    if (journeys.length === 0) {
      return "No saved journeys to report on. Save a journey to get morning briefings.";
    }

    const journeySummaries = journeys.map((j) => {
      const incidents = incidentsByJourney.get(j.id) || [];
      const critical = incidents.filter((i) => i.severity === "critical" || i.severity === "high");
      return `Route "${j.name}" (${j.origin.label} → ${j.destination.label}): ${incidents.length} incidents (${critical.length} critical/high)`;
    }).join("\n");

    return this.chatCompletion([
      {
        role: "system",
        content:
          "You are TRAFI, a Danish traffic assistant. Generate a brief morning commute briefing (3-5 sentences). For each route, mention if it's clear or has issues. Suggest alternatives if a route has major problems. Be concise and actionable. Respond in the same language the user typically uses (Danish/English).",
      },
      {
        role: "user",
        content: `Morning commute status:\n${journeySummaries}`,
      },
    ], { temperature: 0.5, maxTokens: 512 });
  }

  /**
   * Analyze incidents for a specific journey and provide a reroute recommendation.
   */
  async analyzeReroute(
    journey: SavedJourney,
    incidents: TrafficIncident[],
    currentDelayMinutes: number
  ): Promise<string> {
    const incidentList = incidents
      .map((i) => `- [${i.severity}] ${i.type}: ${i.title} (${i.delayMinutes}min delay)`)
      .join("\n");

    return this.chatCompletion([
      {
        role: "system",
        content:
          "You are TRAFI, a Danish traffic assistant. Briefly analyze the incidents affecting this route and advise whether the user should take an alternative route or wait. Be concise (2-3 sentences).",
      },
      {
        role: "user",
        content: `Route: ${journey.name} (${journey.origin.label} → ${journey.destination.label})\nCurrent total delay: ${currentDelayMinutes} minutes\n\nIncidents:\n${incidentList}`,
      },
    ], { temperature: 0.3, maxTokens: 256 });
  }
}

export const azureOpenAIService = new AzureOpenAIService();
