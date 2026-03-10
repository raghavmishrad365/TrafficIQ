import { describe, it, expect } from "vitest";
import {
  DEFAULT_AGENT_SETTINGS,
  DEFAULT_D365_SETTINGS,
  DEFAULT_DATAVERSE_SETTINGS,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_IOTHUB_SETTINGS,
  DEFAULT_DATAVERSE_MCP_SETTINGS,
} from "../types/settings";
import type {
  D365Settings,
  DataverseSettings,
  EmailSettings,
  IoTHubSettings,
  DataverseMcpSettings,
} from "../types/settings";
import { SPECIALIST_DOMAINS } from "../services/agents/agentRegistry";

describe("Settings Defaults", () => {
  describe("AgentSettings", () => {
    it("has all specialist domains enabled by default", () => {
      for (const domain of SPECIALIST_DOMAINS) {
        expect(DEFAULT_AGENT_SETTINGS.enabledAgents[domain]).toBe(true);
      }
    });

    it("agent order includes all specialist domains", () => {
      expect(DEFAULT_AGENT_SETTINGS.agentOrder).toHaveLength(
        SPECIALIST_DOMAINS.length
      );
      for (const domain of SPECIALIST_DOMAINS) {
        expect(DEFAULT_AGENT_SETTINGS.agentOrder).toContain(domain);
      }
    });

    it("default fallback is supplychain", () => {
      expect(DEFAULT_AGENT_SETTINGS.defaultFallback).toBe("supplychain");
    });

    it("sticky max words is 6", () => {
      expect(DEFAULT_AGENT_SETTINGS.stickyMaxWords).toBe(6);
    });

    it("starts with empty overrides", () => {
      expect(Object.keys(DEFAULT_AGENT_SETTINGS.modelOverrides)).toHaveLength(
        0
      );
      expect(
        Object.keys(DEFAULT_AGENT_SETTINGS.keywordAdditions)
      ).toHaveLength(0);
    });
  });

  describe("D365Settings", () => {
    it("has expected defaults", () => {
      const settings: D365Settings = DEFAULT_D365_SETTINGS;
      expect(settings.foUrl).toBe("");
      expect(settings.legalEntity).toBe("USMF");
      expect(settings.enableMock).toBe(true);
    });
  });

  describe("DataverseSettings", () => {
    it("has expected defaults", () => {
      const settings: DataverseSettings = DEFAULT_DATAVERSE_SETTINGS;
      expect(settings.url).toBe("");
      expect(settings.syncOnStartup).toBe(true);
    });
  });

  describe("EmailSettings", () => {
    it("has expected defaults", () => {
      const settings: EmailSettings = DEFAULT_EMAIL_SETTINGS;
      expect(settings.senderName).toBe("TrafficIQ Alerts");
      expect(settings.enableAlertEmails).toBe(true);
      expect(settings.enableShipmentEmails).toBe(true);
    });
  });

  describe("IoTHubSettings", () => {
    it("has expected defaults", () => {
      const settings: IoTHubSettings = DEFAULT_IOTHUB_SETTINGS;
      expect(settings.hostname).toBe("");
      expect(settings.enableMock).toBe(true);
    });
  });

  describe("DataverseMcpSettings", () => {
    it("has expected defaults", () => {
      const settings: DataverseMcpSettings = DEFAULT_DATAVERSE_MCP_SETTINGS;
      expect(settings.enableMock).toBe(true);
      expect(settings.enableFieldService).toBe(true);
      expect(settings.enableScheduling).toBe(true);
      expect(settings.enableAssetManagement).toBe(true);
    });
  });
});
