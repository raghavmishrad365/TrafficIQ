import { describe, it, expect } from "vitest";
import {
  AGENT_CONFIGS,
  SPECIALIST_DOMAINS,
  STICKY_PATTERNS,
  STICKY_MAX_WORDS,
} from "../services/agents/agentRegistry";

describe("Agent Registry", () => {
  it("has exactly 6 specialist domains", () => {
    expect(SPECIALIST_DOMAINS).toHaveLength(6);
  });

  it("includes all expected specialist domains", () => {
    const expected = [
      "traffic",
      "supplychain",
      "fleet",
      "operations",
      "fieldservice",
      "iotlogistics",
    ];
    expect(SPECIALIST_DOMAINS).toEqual(expect.arrayContaining(expected));
  });

  it("each agent has required config properties", () => {
    for (const domain of SPECIALIST_DOMAINS) {
      const config = AGENT_CONFIGS[domain];
      expect(config.domain).toBe(domain);
      expect(config.name).toBeTruthy();
      expect(config.displayName).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.keywords.length).toBeGreaterThan(0);
    }
  });

  it("agent colors are unique across all agents", () => {
    const colors = SPECIALIST_DOMAINS.map((d) => AGENT_CONFIGS[d].color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it("no duplicate keywords within the same agent", () => {
    for (const domain of SPECIALIST_DOMAINS) {
      const keywords = AGENT_CONFIGS[domain].keywords;
      const unique = new Set(keywords);
      expect(unique.size).toBe(keywords.length);
    }
  });

  it("sticky patterns are valid regexes", () => {
    expect(STICKY_PATTERNS.length).toBeGreaterThan(0);
    for (const pattern of STICKY_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });

  it("sticky max words is a reasonable value", () => {
    expect(STICKY_MAX_WORDS).toBe(3);
    expect(STICKY_MAX_WORDS).toBeGreaterThan(0);
    expect(STICKY_MAX_WORDS).toBeLessThan(20);
  });

  it("sticky patterns match expected follow-up phrases", () => {
    const followUps = ["yes", "no", "show more", "tell me more", "thanks"];
    for (const phrase of followUps) {
      const matches = STICKY_PATTERNS.some((p) => p.test(phrase));
      expect(matches).toBe(true);
    }
  });
});
