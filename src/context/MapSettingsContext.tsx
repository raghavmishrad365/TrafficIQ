import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { storageService } from "../services/storageService";

export type MapStyle = "road" | "satellite" | "night";

export interface MapCenter {
  lat: number;
  lng: number;
  label: string;
}

export type MapLanguage =
  | "da-DK"
  | "en-US"
  | "de-DE"
  | "sv-SE"
  | "nb-NO"
  | "fi-FI"
  | "nl-NL"
  | "fr-FR";

const STORAGE_KEY = "trafficiq_map_settings";

export type TravelMode = "car" | "truck";

interface MapSettings {
  showTraffic: boolean;
  mapStyle: MapStyle;
  defaultZoom: number;
  defaultCenter: MapCenter;
  defaultLanguage: MapLanguage;
  showWeather: boolean;
  showPOIs: boolean;
  enableClustering: boolean;
  preferredTravelMode: TravelMode;
}

interface MapSettingsContextValue extends MapSettings {
  setShowTraffic: (value: boolean) => void;
  setMapStyle: (style: MapStyle) => void;
  setDefaultZoom: (zoom: number) => void;
  setDefaultCenter: (center: MapCenter) => void;
  setDefaultLanguage: (lang: MapLanguage) => void;
  setShowWeather: (value: boolean) => void;
  setShowPOIs: (value: boolean) => void;
  setEnableClustering: (value: boolean) => void;
  setPreferredTravelMode: (mode: TravelMode) => void;
}

const defaults: MapSettings = {
  showTraffic: true,
  mapStyle: "road",
  defaultZoom: 10,
  defaultCenter: { lat: 55.6761, lng: 12.5683, label: "Copenhagen" },
  defaultLanguage: "da-DK",
  showWeather: false,
  showPOIs: false,
  enableClustering: true,
  preferredTravelMode: "car",
};

function loadSettings(): MapSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaults;
}

function saveSettings(settings: MapSettings) {
  storageService.saveMapSettings(settings);
}

const MapSettingsContext = createContext<MapSettingsContextValue | null>(null);

export function MapSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MapSettings>(loadSettings);

  const setShowTraffic = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, showTraffic: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const setMapStyle = useCallback((style: MapStyle) => {
    setSettings((prev) => {
      const next = { ...prev, mapStyle: style };
      saveSettings(next);
      return next;
    });
  }, []);

  const setDefaultZoom = useCallback((zoom: number) => {
    setSettings((prev) => {
      const next = { ...prev, defaultZoom: zoom };
      saveSettings(next);
      return next;
    });
  }, []);

  const setDefaultCenter = useCallback((center: MapCenter) => {
    setSettings((prev) => {
      const next = { ...prev, defaultCenter: center };
      saveSettings(next);
      return next;
    });
  }, []);

  const setDefaultLanguage = useCallback((lang: MapLanguage) => {
    setSettings((prev) => {
      const next = { ...prev, defaultLanguage: lang };
      saveSettings(next);
      return next;
    });
  }, []);

  const setShowWeather = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, showWeather: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const setShowPOIs = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, showPOIs: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const setEnableClustering = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, enableClustering: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const setPreferredTravelMode = useCallback((mode: TravelMode) => {
    setSettings((prev) => {
      const next = { ...prev, preferredTravelMode: mode };
      saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      showTraffic: settings.showTraffic,
      mapStyle: settings.mapStyle,
      defaultZoom: settings.defaultZoom,
      defaultCenter: settings.defaultCenter,
      defaultLanguage: settings.defaultLanguage,
      showWeather: settings.showWeather,
      showPOIs: settings.showPOIs,
      enableClustering: settings.enableClustering,
      preferredTravelMode: settings.preferredTravelMode,
      setShowTraffic,
      setMapStyle,
      setDefaultZoom,
      setDefaultCenter,
      setDefaultLanguage,
      setShowWeather,
      setShowPOIs,
      setEnableClustering,
      setPreferredTravelMode,
    }),
    [settings, setShowTraffic, setMapStyle, setDefaultZoom, setDefaultCenter, setDefaultLanguage, setShowWeather, setShowPOIs, setEnableClustering, setPreferredTravelMode]
  );

  return (
    <MapSettingsContext.Provider value={value}>
      {children}
    </MapSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMapSettings(): MapSettingsContextValue {
  const ctx = useContext(MapSettingsContext);
  if (!ctx)
    throw new Error("useMapSettings must be used within MapSettingsProvider");
  return ctx;
}
