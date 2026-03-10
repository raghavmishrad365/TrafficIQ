import { webLightTheme, webDarkTheme, type Theme } from "@fluentui/react-components";

/**
 * Traffic-specific CSS custom property tokens.
 * These are set on document.documentElement by ThemeContext
 * and can be used in makeStyles via `var(--token-name)`.
 */
export interface TrafficTokenValues {
  "--traffic-clear": string;
  "--traffic-moderate": string;
  "--traffic-heavy": string;
  "--traffic-severe": string;
  "--glass-surface": string;
  "--glass-border": string;
  "--glass-surface-hover": string;
  "--header-gradient-start": string;
  "--header-gradient-end": string;
  "--header-text": string;
  "--header-text-secondary": string;
  "--header-button-hover": string;
  "--chat-overlay": string;
  "--page-bg": string;
}

export const lightTrafficTokens: TrafficTokenValues = {
  "--traffic-clear": "#0E7A0D",
  "--traffic-moderate": "#C19C00",
  "--traffic-heavy": "#DA3B01",
  "--traffic-severe": "#A4262C",
  "--glass-surface": "rgba(255, 255, 255, 0.78)",
  "--glass-border": "rgba(255, 255, 255, 0.45)",
  "--glass-surface-hover": "rgba(255, 255, 255, 0.88)",
  "--header-gradient-start": "#0078D4",
  "--header-gradient-end": "#005A9E",
  "--header-text": "#FFFFFF",
  "--header-text-secondary": "rgba(255, 255, 255, 0.75)",
  "--header-button-hover": "rgba(255, 255, 255, 0.15)",
  "--chat-overlay": "rgba(0, 0, 0, 0.4)",
  "--page-bg": "#F5F5F5",
};

export const darkTrafficTokens: TrafficTokenValues = {
  "--traffic-clear": "#359B35",
  "--traffic-moderate": "#FFD335",
  "--traffic-heavy": "#F7630C",
  "--traffic-severe": "#FF4343",
  "--glass-surface": "rgba(32, 32, 32, 0.78)",
  "--glass-border": "rgba(255, 255, 255, 0.08)",
  "--glass-surface-hover": "rgba(45, 45, 45, 0.88)",
  "--header-gradient-start": "#1a2332",
  "--header-gradient-end": "#0d1117",
  "--header-text": "#FFFFFF",
  "--header-text-secondary": "rgba(255, 255, 255, 0.65)",
  "--header-button-hover": "rgba(255, 255, 255, 0.1)",
  "--chat-overlay": "rgba(0, 0, 0, 0.6)",
  "--page-bg": "#1A1A1A",
};

export const trafficLightTheme: Theme = {
  ...webLightTheme,
};

export const trafficDarkTheme: Theme = {
  ...webDarkTheme,
};
