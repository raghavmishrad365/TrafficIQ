import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Theme } from "@fluentui/react-components";
import {
  trafficLightTheme,
  trafficDarkTheme,
  lightTrafficTokens,
  darkTrafficTokens,
  type TrafficTokenValues,
} from "../styles/trafficTheme";
import { storageService } from "../services/storageService";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "trafficiq_theme";

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  fluentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTokens(tokens: TrafficTokenValues) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system")
        return saved;
    } catch {
      // ignore
    }
    return "system";
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme: ResolvedTheme =
    themeMode === "system" ? systemTheme : themeMode;

  const fluentTheme = useMemo(
    () => (resolvedTheme === "dark" ? trafficDarkTheme : trafficLightTheme),
    [resolvedTheme]
  );

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply CSS custom properties and data attribute
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    applyTokens(
      resolvedTheme === "dark" ? darkTrafficTokens : lightTrafficTokens
    );
  }, [resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    storageService.saveTheme(mode);
  }, []);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode, fluentTheme }),
    [themeMode, resolvedTheme, setThemeMode, fluentTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
