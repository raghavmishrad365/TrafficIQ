export const env = {
  agentEndpoint: import.meta.env.VITE_AGENT_ENDPOINT,
  agentApiKey: import.meta.env.VITE_AGENT_API_KEY,
  agentModelDeployment: import.meta.env.VITE_AGENT_MODEL_DEPLOYMENT,
  azureTenantId: import.meta.env.VITE_AZURE_TENANT_ID,
  azureClientId: import.meta.env.VITE_AZURE_CLIENT_ID,
  azureMapsKey: import.meta.env.VITE_AZURE_MAPS_KEY,
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  emailFlowUrl: import.meta.env.VITE_EMAIL_FLOW_URL,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  // Azure OpenAI (fallback for non-agent completions like summaries)
  azureOpenAIEndpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
  azureOpenAIKey: import.meta.env.VITE_AZURE_OPENAI_KEY,
  azureOpenAIDeployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT,
  // Microsoft Foundry Agent Service
  foundryProjectEndpoint: import.meta.env.VITE_FOUNDRY_PROJECT_ENDPOINT,
  foundryApiKey: import.meta.env.VITE_FOUNDRY_API_KEY,
  foundryModelDeployment: import.meta.env.VITE_FOUNDRY_MODEL_DEPLOYMENT,
  // Dataverse (browser only needs the URL to know it's configured; auth is server-side)
  dataverseUrl: import.meta.env.VITE_DATAVERSE_URL,
  // Dataverse MCP Server (Model Context Protocol for Dataverse / Field Service)
  dataverseMcpUrl: import.meta.env.VITE_DATAVERSE_MCP_URL,
  // D365 Finance & Operations MCP
  d365FoUrl: import.meta.env.VITE_D365_FO_URL,
  // Azure IoT Hub
  iotHubHostname: import.meta.env.VITE_IOT_HUB_HOSTNAME,
  iotHubSasToken: import.meta.env.VITE_IOT_HUB_SAS_TOKEN,
} as const;
