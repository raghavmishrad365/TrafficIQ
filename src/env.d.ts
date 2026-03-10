/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENT_ENDPOINT: string;
  readonly VITE_AGENT_API_KEY: string;
  readonly VITE_AGENT_MODEL_DEPLOYMENT: string;
  readonly VITE_AZURE_OPENAI_ENDPOINT: string;
  readonly VITE_AZURE_OPENAI_KEY: string;
  readonly VITE_AZURE_OPENAI_DEPLOYMENT: string;
  readonly VITE_FOUNDRY_PROJECT_ENDPOINT: string;
  readonly VITE_FOUNDRY_API_KEY: string;
  readonly VITE_FOUNDRY_MODEL_DEPLOYMENT: string;
  readonly VITE_AZURE_TENANT_ID: string;
  readonly VITE_AZURE_CLIENT_ID: string;
  readonly VITE_AZURE_MAPS_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_EMAIL_FLOW_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DATAVERSE_URL: string;
  readonly VITE_D365_FO_URL: string;
  readonly VITE_AZURE_KEY_VAULT_URL: string;
  readonly VITE_IOT_HUB_HOSTNAME: string;
  readonly VITE_IOT_HUB_SAS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
