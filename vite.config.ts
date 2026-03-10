import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { powerApps } from "@microsoft/power-apps-vite/plugin"
import { keyVaultPlugin } from "./vite-keyvault-plugin"
import { dataverseProxy } from "./vite-dataverse-proxy"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ prefixed) into process.env
  // so server-side plugins like dataverseProxy can read DATAVERSE_URL,
  // DATAVERSE_TENANT_ID, DATAVERSE_CLIENT_ID, DATAVERSE_CLIENT_SECRET.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [keyVaultPlugin(), react(), powerApps(), dataverseProxy()],
  };
});
