import { describe, it, expect } from "vitest";
import { ROUTES, journeyDetailsPath } from "../config/routes";
import { STORAGE_KEYS, POLLING_INTERVALS } from "../utils/constants";

describe("Routes", () => {
  it("defines all 17 expected routes", () => {
    const routeKeys = Object.keys(ROUTES);
    expect(routeKeys.length).toBe(17);
  });

  it("dashboard route is root path", () => {
    expect(ROUTES.DASHBOARD).toBe("/");
  });

  it("all routes start with /", () => {
    for (const route of Object.values(ROUTES)) {
      expect(route).toMatch(/^\//);
    }
  });

  it("no duplicate route paths (except parameterized)", () => {
    const paths = Object.values(ROUTES).filter((r) => !r.includes(":"));
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it("journeyDetailsPath generates correct path", () => {
    expect(journeyDetailsPath("abc-123")).toBe("/journey/abc-123");
    expect(journeyDetailsPath("test")).toBe("/journey/test");
  });
});

describe("Storage Keys", () => {
  it("all storage keys are unique", () => {
    const values = Object.values(STORAGE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("includes business data keys", () => {
    expect(STORAGE_KEYS.SAVED_JOURNEYS).toBeDefined();
    expect(STORAGE_KEYS.SHIPMENTS).toBeDefined();
    expect(STORAGE_KEYS.FLEET_VEHICLES).toBeDefined();
    expect(STORAGE_KEYS.WORK_ORDERS).toBeDefined();
    expect(STORAGE_KEYS.MAINTENANCE_ALERTS).toBeDefined();
  });

  it("includes settings dual-write keys", () => {
    expect(STORAGE_KEYS.DEMO_MODE).toBeDefined();
    expect(STORAGE_KEYS.THEME).toBeDefined();
    expect(STORAGE_KEYS.MAP_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.D365_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.DATAVERSE_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.DATAVERSE_MCP_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.EMAIL_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.IOTHUB_SETTINGS).toBeDefined();
    expect(STORAGE_KEYS.AGENT_SETTINGS).toBeDefined();
  });
});

describe("Polling Intervals", () => {
  it("all intervals are positive numbers", () => {
    for (const interval of Object.values(POLLING_INTERVALS)) {
      expect(interval).toBeGreaterThan(0);
    }
  });

  it("dashboard traffic polls every 60 seconds", () => {
    expect(POLLING_INTERVALS.DASHBOARD_TRAFFIC).toBe(60_000);
  });
});
