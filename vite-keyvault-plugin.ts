import type { Plugin } from "vite";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Mapping from Azure Key Vault secret names to environment variable names.
 * Key Vault names use hyphens (Azure restriction); env vars use underscores.
 */
const SECRET_MAP: Record<string, string> = {
  // Frontend (VITE_ prefix — exposed to browser via import.meta.env)
  "agent-endpoint": "VITE_AGENT_ENDPOINT",
  "agent-api-key": "VITE_AGENT_API_KEY",
  "agent-model-deployment": "VITE_AGENT_MODEL_DEPLOYMENT",
  "azure-openai-endpoint": "VITE_AZURE_OPENAI_ENDPOINT",
  "azure-openai-key": "VITE_AZURE_OPENAI_KEY",
  "azure-openai-deployment": "VITE_AZURE_OPENAI_DEPLOYMENT",
  "azure-maps-key": "VITE_AZURE_MAPS_KEY",
  "vapid-public-key": "VITE_VAPID_PUBLIC_KEY",
  "email-flow-url": "VITE_EMAIL_FLOW_URL",
  "dataverse-browser-url": "VITE_DATAVERSE_URL",
  "d365-fo-url": "VITE_D365_FO_URL",
  "foundry-project-endpoint": "VITE_FOUNDRY_PROJECT_ENDPOINT",
  "foundry-api-key": "VITE_FOUNDRY_API_KEY",
  "foundry-model-deployment": "VITE_FOUNDRY_MODEL_DEPLOYMENT",
  // Server-only (no VITE_ prefix — NOT exposed to browser)
  "dataverse-url": "DATAVERSE_URL",
  "dataverse-tenant-id": "DATAVERSE_TENANT_ID",
  "dataverse-client-id": "DATAVERSE_CLIENT_ID",
  "dataverse-client-secret": "DATAVERSE_CLIENT_SECRET",
};

/**
 * Vite plugin that loads secrets from Azure Key Vault at startup.
 *
 * Reads `AZURE_KEY_VAULT_URL` from process.env (set in .env).
 * Authenticates via DefaultAzureCredential (supports Azure CLI, managed identity, env creds).
 * Fetches each mapped secret and injects it into process.env.
 * Falls back to existing .env values if Key Vault is not configured or unreachable.
 */
export function keyVaultPlugin(): Plugin {
  return {
    name: "vite-keyvault",
    enforce: "pre",

    async config(_config, { mode }) {
      const vaultUrl = process.env.AZURE_KEY_VAULT_URL;

      if (!vaultUrl) {
        console.log(
          "[keyvault] AZURE_KEY_VAULT_URL not set — using .env fallback"
        );
        return {};
      }

      console.log(`[keyvault] Loading secrets from ${vaultUrl} (mode: ${mode})...`);

      try {
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(vaultUrl, credential);

        let loaded = 0;
        const envOverrides: Record<string, string> = {};

        for (const [secretName, envVar] of Object.entries(SECRET_MAP)) {
          try {
            const secret = await client.getSecret(secretName);
            if (secret.value) {
              // Set on process.env so server-side plugins (dataverseProxy) pick it up
              process.env[envVar] = secret.value;

              // Collect VITE_ vars for client-side injection
              if (envVar.startsWith("VITE_")) {
                envOverrides[envVar] = secret.value;
              }

              loaded++;
            }
          } catch {
            // Secret doesn't exist in vault — skip, fall back to .env value
          }
        }

        console.log(
          `[keyvault] Loaded ${loaded}/${Object.keys(SECRET_MAP).length} secrets from Key Vault`
        );

        // Return env overrides so Vite merges them with .env values
        // VITE_ prefixed vars become available via import.meta.env
        // Also expose the vault URL itself so the Settings page can display it
        envOverrides["VITE_AZURE_KEY_VAULT_URL"] = vaultUrl;

        return {
          define: Object.fromEntries(
            Object.entries(envOverrides).map(([key, value]) => [
              `import.meta.env.${key}`,
              JSON.stringify(value),
            ])
          ),
        };
      } catch (err) {
        console.warn(
          `[keyvault] Failed to connect to Key Vault — using .env fallback:`,
          err instanceof Error ? err.message : err
        );
        return {};
      }
    },
  };
}
