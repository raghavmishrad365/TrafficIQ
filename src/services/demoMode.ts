/**
 * Global demo mode toggle.
 *
 * When demo mode is enabled, all services (D365 MCP, IoT Hub, Field Service)
 * return rich mock data for demonstration purposes.
 * When disabled, services will only use live connections (or return empty data
 * if no connection is configured).
 *
 * The setting is persisted in localStorage AND synced to Dataverse
 * tiq_appsettings table via storageService.
 */

import { storageService } from "./storageService";

const DEMO_MODE_KEY = "trafficiq_demo_mode";

/** Returns `true` when mock / demo data should be served. */
export function isDemoModeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(DEMO_MODE_KEY);
    if (raw !== null) return JSON.parse(raw) === true;
  } catch { /* ignore */ }
  // Default: demo mode ON (matches previous behaviour)
  return true;
}

/** Persist the demo-mode flag to localStorage + Dataverse. */
export function setDemoModeEnabled(enabled: boolean): void {
  storageService.saveDemoMode(enabled);
}
