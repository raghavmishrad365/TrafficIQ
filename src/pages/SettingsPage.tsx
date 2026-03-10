import { useState, useCallback } from "react";
import { isDemoModeEnabled, setDemoModeEnabled } from "../services/demoMode";
import {
  makeStyles,
  tokens,
  Text,
  Card,
  CardHeader,
  Switch,
  Button,
  Badge,
  RadioGroup,
  Radio,
  Label,
  shorthands,
  Slider,
  Dropdown,
  Option,
  Input,
  Tab,
  TabList,
  Divider,
} from "@fluentui/react-components";
import {
  WeatherSunny24Regular,
  Map24Regular,
  Alert24Regular,
  Database24Regular,
  Info24Regular,
  VehicleCar24Filled,
  Mail24Regular,
  Settings24Regular,
  PlugConnected24Regular,
  Checkmark24Regular,
  ShieldLock24Regular,
  Dismiss24Regular,
  BotSparkle24Regular,
  VehicleCar16Regular,
  Box16Regular,
  VehicleTruckProfile16Regular,
  Wrench16Regular,
  PersonWrench20Regular,
  LocationRipple16Regular,
  ArrowUp16Regular,
  ArrowDown16Regular,
  Add16Regular,
  DismissCircle16Regular,
} from "@fluentui/react-icons";
import { useNotificationContext } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useMapSettings } from "../context/MapSettingsContext";
import type { MapStyle, MapLanguage, MapCenter, TravelMode } from "../context/MapSettingsContext";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AGENT_CONFIGS, SPECIALIST_DOMAINS } from "../services/agents/agentRegistry";
import type { AgentDomain } from "../services/agents/agentRegistry";
import { storageService } from "../services/storageService";
import { STORAGE_KEYS } from "../utils/constants";
import type {
  D365Settings,
  DataverseSettings,
  EmailSettings,
  IoTHubSettings,
  DataverseMcpSettings,
  AgentSettings,
} from "../types/settings";
import {
  DEFAULT_AGENT_SETTINGS,
  DEFAULT_D365_SETTINGS,
  DEFAULT_DATAVERSE_SETTINGS,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_IOTHUB_SETTINGS,
  DEFAULT_DATAVERSE_MCP_SETTINGS,
} from "../types/settings";
import { trafficToolDefinitions } from "../services/agents/tools/trafficTools";
import { supplyChainToolDefinitions } from "../services/agents/tools/supplyChainTools";
import { fleetToolDefinitions } from "../services/agents/tools/fleetTools";
import { operationsToolDefinitions } from "../services/agents/tools/operationsTools";
import { fieldServiceToolDefinitions } from "../services/agents/tools/fieldServiceTools";
import { iotLogisticsToolDefinitions } from "../services/agents/tools/iotLogisticsTools";
import type { OpenAIToolDefinition } from "../services/agentTools";

const LANGUAGE_OPTIONS: { value: MapLanguage; label: string }[] = [
  { value: "da-DK", label: "Danish (da-DK)" },
  { value: "en-US", label: "English (en-US)" },
  { value: "de-DE", label: "German (de-DE)" },
  { value: "sv-SE", label: "Swedish (sv-SE)" },
  { value: "nb-NO", label: "Norwegian (nb-NO)" },
  { value: "fi-FI", label: "Finnish (fi-FI)" },
  { value: "nl-NL", label: "Dutch (nl-NL)" },
  { value: "fr-FR", label: "French (fr-FR)" },
];

const CENTER_PRESETS: MapCenter[] = [
  { lat: 55.6761, lng: 12.5683, label: "Copenhagen" },
  { lat: 56.1629, lng: 10.2039, label: "Aarhus" },
  { lat: 55.4038, lng: 10.4024, label: "Odense" },
  { lat: 57.0488, lng: 9.9217, label: "Aalborg" },
  { lat: 55.8609, lng: 9.8378, label: "Vejle" },
  { lat: 52.5200, lng: 13.4050, label: "Berlin" },
  { lat: 59.3293, lng: 18.0686, label: "Stockholm" },
  { lat: 59.9139, lng: 10.7522, label: "Oslo" },
];

const MODEL_DEPLOYMENT_OPTIONS = [
  { value: "", label: "Use global default" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
];

const DOMAIN_TOOLS: Record<Exclude<AgentDomain, "orchestrator">, OpenAIToolDefinition[]> = {
  traffic: trafficToolDefinitions,
  supplychain: supplyChainToolDefinitions,
  fleet: fleetToolDefinitions,
  operations: operationsToolDefinitions,
  fieldservice: fieldServiceToolDefinitions,
  iotlogistics: iotLogisticsToolDefinitions,
};

function AgentIconForDomain({ domain }: { domain: string }) {
  switch (domain) {
    case "traffic": return <VehicleCar16Regular />;
    case "supplychain": return <Box16Regular />;
    case "fleet": return <VehicleTruckProfile16Regular />;
    case "operations": return <Wrench16Regular />;
    case "fieldservice": return <PersonWrench20Regular style={{ width: 16, height: 16 }} />;
    case "iotlogistics": return <LocationRipple16Regular />;
    default: return null;
  }
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    borderTop: "3px solid",
    borderImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed}) 1`,
    ...shorthands.padding(tokens.spacingVerticalM, "0"),
  },
  tabContent: {
    ...shorthands.padding(tokens.spacingVerticalL, "0"),
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  card: {
    borderRadius: tokens.borderRadiusXLarge,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  coordRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
  },
  aboutBrand: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  aboutIcon: {
    width: "36px",
    height: "36px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  agentCard: {
    borderRadius: tokens.borderRadiusXLarge,
    overflow: "hidden",
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  agentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: tokens.spacingHorizontalS,
  },
  agentHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    overflow: "hidden",
  },
  agentIconBox: {
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  agentMeta: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
  },
  toolsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  toolChip: {
    display: "inline-flex",
    alignItems: "center",
    ...shorthands.padding("2px", "8px"),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase100,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  keywordsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    maxHeight: "120px",
    overflowY: "auto",
  },
  keywordChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    ...shorthands.padding("1px", "6px"),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    fontSize: tokens.fontSizeBase100,
    cursor: "default",
  },
  keywordDismiss: {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    ":hover": {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  addKeywordRow: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    alignItems: "center",
  },
  orderButtons: {
    display: "flex",
    gap: "2px",
    alignItems: "center",
  },
  routingTier: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    flexWrap: "wrap",
  },
  routingArrow: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightBold,
  },
});

type SettingsTab = "general" | "map" | "d365" | "dataverse" | "dataverse-mcp" | "email" | "iothub" | "keyvault" | "agents";

export function SettingsPage() {
  const styles = useStyles();
  const { preferences, updatePreferences } = useNotificationContext();
  const { themeMode, setThemeMode } = useTheme();
  const {
    showTraffic,
    mapStyle,
    defaultZoom,
    defaultCenter,
    defaultLanguage,
    showWeather,
    showPOIs,
    enableClustering,
    preferredTravelMode,
    setShowTraffic,
    setMapStyle,
    setDefaultZoom,
    setDefaultCenter,
    setDefaultLanguage,
    setShowWeather,
    setShowPOIs,
    setEnableClustering,
    setPreferredTravelMode,
  } = useMapSettings();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SettingsTab>("general");
  const [demoMode, setDemoMode] = useState(() => isDemoModeEnabled());

  // D365 F&O Settings
  const [d365, setD365] = useState<D365Settings>(() =>
    storageService.getAppSetting(STORAGE_KEYS.D365_SETTINGS, DEFAULT_D365_SETTINGS)
  );

  // Dataverse Settings
  const [dataverse, setDataverse] = useState<DataverseSettings>(() =>
    storageService.getAppSetting(STORAGE_KEYS.DATAVERSE_SETTINGS, DEFAULT_DATAVERSE_SETTINGS)
  );

  // Email Settings
  const [email, setEmail] = useState<EmailSettings>(() =>
    storageService.getAppSetting(STORAGE_KEYS.EMAIL_SETTINGS, DEFAULT_EMAIL_SETTINGS)
  );

  // IoT Hub Settings
  const [iotHub, setIotHub] = useState<IoTHubSettings>(() =>
    storageService.getAppSetting(STORAGE_KEYS.IOTHUB_SETTINGS, DEFAULT_IOTHUB_SETTINGS)
  );

  // Dataverse MCP Settings
  const [dataverseMcp, setDataverseMcp] = useState<DataverseMcpSettings>(() =>
    storageService.getAppSetting(STORAGE_KEYS.DATAVERSE_MCP_SETTINGS, DEFAULT_DATAVERSE_MCP_SETTINGS)
  );

  // Agent Settings
  const [agentSettings, setAgentSettings] = useState<AgentSettings>(() =>
    storageService.getAgentSettings(DEFAULT_AGENT_SETTINGS)
  );
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});

  const handleClearData = () => {
    localStorage.clear();
    setClearDialogOpen(false);
    window.location.reload();
  };

  const updateD365 = useCallback((updates: Partial<D365Settings>) => {
    setD365((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveD365Settings(next);
      return next;
    });
  }, []);

  const updateDataverse = useCallback((updates: Partial<DataverseSettings>) => {
    setDataverse((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveDataverseSettings(next);
      return next;
    });
  }, []);

  const updateEmail = useCallback((updates: Partial<EmailSettings>) => {
    setEmail((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveEmailSettings(next);
      return next;
    });
  }, []);

  const updateIotHub = useCallback((updates: Partial<IoTHubSettings>) => {
    setIotHub((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveIoTHubSettings(next);
      return next;
    });
  }, []);

  const updateDataverseMcp = useCallback((updates: Partial<DataverseMcpSettings>) => {
    setDataverseMcp((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveDataverseMcpSettings(next);
      return next;
    });
  }, []);

  const updateAgentSettings = useCallback((updates: Partial<AgentSettings>) => {
    setAgentSettings((prev) => {
      const next = { ...prev, ...updates };
      storageService.saveAgentSettings(next, AGENT_CONFIGS);
      return next;
    });
  }, []);

  const toggleAgent = useCallback((domain: string) => {
    setAgentSettings((prev) => {
      const next = {
        ...prev,
        enabledAgents: { ...prev.enabledAgents, [domain]: !prev.enabledAgents[domain] },
      };
      storageService.saveAgentSettings(next, AGENT_CONFIGS);
      return next;
    });
  }, []);

  const moveAgent = useCallback((domain: string, direction: "up" | "down") => {
    setAgentSettings((prev) => {
      const order = [...prev.agentOrder];
      const idx = order.indexOf(domain);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= order.length) return prev;
      [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];
      const next = { ...prev, agentOrder: order };
      storageService.saveAgentSettings(next, AGENT_CONFIGS);
      return next;
    });
  }, []);

  const addKeywordToAgent = useCallback((domain: string, keyword: string) => {
    if (!keyword.trim()) return;
    setAgentSettings((prev) => {
      const existing = prev.keywordAdditions[domain] || [];
      if (existing.includes(keyword.trim())) return prev;
      const next = {
        ...prev,
        keywordAdditions: { ...prev.keywordAdditions, [domain]: [...existing, keyword.trim()] },
      };
      storageService.saveAgentSettings(next, AGENT_CONFIGS);
      return next;
    });
    setNewKeyword((prev) => ({ ...prev, [domain]: "" }));
  }, []);

  const removeKeywordFromAgent = useCallback((domain: string, keyword: string) => {
    setAgentSettings((prev) => {
      const existing = prev.keywordAdditions[domain] || [];
      const next = {
        ...prev,
        keywordAdditions: { ...prev.keywordAdditions, [domain]: existing.filter(k => k !== keyword) },
      };
      storageService.saveAgentSettings(next, AGENT_CONFIGS);
      return next;
    });
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Settings
        </Text>
        <Text size={200}>Manage your app preferences, connections, and integrations</Text>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as SettingsTab)}
      >
        <Tab value="general" icon={<Settings24Regular />}>General</Tab>
        <Tab value="map" icon={<Map24Regular />}>Map</Tab>
        <Tab value="d365" icon={<PlugConnected24Regular />}>D365 F&O MCP</Tab>
        <Tab value="dataverse" icon={<Database24Regular />}>Dataverse</Tab>
        <Tab value="dataverse-mcp" icon={<PlugConnected24Regular />}>Dataverse MCP</Tab>
        <Tab value="email" icon={<Mail24Regular />}>Email</Tab>
        <Tab value="iothub" icon={<PlugConnected24Regular />}>IoT Hub</Tab>
        <Tab value="keyvault" icon={<ShieldLock24Regular />}>Key Vault</Tab>
        <Tab value="agents" icon={<BotSparkle24Regular />}>Agents</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {/* ========== General Tab ========== */}
        {selectedTab === "general" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<WeatherSunny24Regular />}
                header={<Text weight="semibold">Appearance</Text>}
                description="Choose your preferred theme"
              />
              <div className={styles.cardContent}>
                <Label>Theme</Label>
                <RadioGroup
                  value={themeMode}
                  onChange={(_, data) =>
                    setThemeMode(data.value as "light" | "dark" | "system")
                  }
                >
                  <Radio value="light" label="Light" />
                  <Radio value="dark" label="Dark" />
                  <Radio value="system" label="System (follow OS)" />
                </RadioGroup>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Alert24Regular />}
                header={<Text weight="semibold">Notification Preferences</Text>}
                description="Choose how and when you receive alerts"
              />
              <div className={styles.cardContent}>
                <Switch
                  label="In-app toast notifications"
                  checked={preferences.toastEnabled}
                  onChange={(_, data) =>
                    updatePreferences({ ...preferences, toastEnabled: data.checked })
                  }
                />
                <Switch
                  label="Push notifications"
                  checked={preferences.pushEnabled}
                  onChange={(_, data) =>
                    updatePreferences({ ...preferences, pushEnabled: data.checked })
                  }
                />
                <Switch
                  label="Email notifications"
                  checked={preferences.emailEnabled}
                  onChange={(_, data) =>
                    updatePreferences({ ...preferences, emailEnabled: data.checked })
                  }
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<BotSparkle24Regular />}
                header={<Text weight="semibold">Demo Mode</Text>}
                description="Global toggle for mock / demonstration data"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={demoMode ? "informative" : "subtle"}
                    size="small"
                  >
                    {demoMode ? "Demo Data Active" : "Live Only"}
                  </Badge>
                  <Text size={200}>
                    {demoMode
                      ? "All services return rich demo data for showcasing"
                      : "Services require live connections — no mock data"}
                  </Text>
                </div>
                <Divider />
                <Switch
                  label="Enable demo / mock data globally"
                  checked={demoMode}
                  onChange={(_, data) => {
                    setDemoMode(data.checked);
                    setDemoModeEnabled(data.checked);
                  }}
                />
                <Text size={100}>
                  When enabled, D365 F&O MCP, Dataverse MCP, IoT Hub, and Field
                  Service agents all return synthetic demonstration data. Disable
                  this to require live connections.
                </Text>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Database24Regular />}
                header={<Text weight="semibold">Data Management</Text>}
                description="Clear stored journeys and history"
              />
              <div className={styles.cardContent}>
                <Button
                  appearance="secondary"
                  onClick={() => setClearDialogOpen(true)}
                >
                  Clear All Data
                </Button>
                <Text size={200}>
                  This will remove all saved journeys, settings, and notification history.
                </Text>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">About</Text>}
                description="Application details and version"
              />
              <div className={styles.cardContent}>
                <div className={styles.aboutBrand}>
                  <div className={styles.aboutIcon}>
                    <VehicleCar24Filled />
                  </div>
                  <div className={styles.aboutInfo}>
                    <Text weight="semibold" size={300}>
                      TrafficIQ
                    </Text>
                    <Badge appearance="outline" size="small" color="brand">
                      v1.0.0
                    </Badge>
                  </div>
                </div>
                <Text size={200}>Supply Chain Transport Intelligence</Text>
                <Text size={200}>Powered by Microsoft Foundry Agent Service</Text>
              </div>
            </Card>
          </div>
        )}

        {/* ========== Map Tab ========== */}
        {selectedTab === "map" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<Map24Regular />}
                header={<Text weight="semibold">Map Display</Text>}
                description="Configure traffic overlay and visual style"
              />
              <div className={styles.cardContent}>
                <Switch
                  label="Show traffic overlay"
                  checked={showTraffic}
                  onChange={(_, data) => setShowTraffic(data.checked)}
                />
                <Label>Map style</Label>
                <RadioGroup
                  value={mapStyle}
                  onChange={(_, data) => setMapStyle(data.value as MapStyle)}
                >
                  <Radio value="road" label="Road" />
                  <Radio value="satellite" label="Satellite" />
                  <Radio value="night" label="Night" />
                </RadioGroup>
                <Label>Default zoom level: {defaultZoom}</Label>
                <Slider
                  min={1}
                  max={20}
                  value={defaultZoom}
                  onChange={(_, data) => setDefaultZoom(data.value)}
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Map24Regular />}
                header={<Text weight="semibold">Default Center</Text>}
                description="Set the initial map center location"
              />
              <div className={styles.cardContent}>
                <Label>Preset locations</Label>
                <Dropdown
                  placeholder="Choose a city"
                  value={defaultCenter.label}
                  onOptionSelect={(_, data) => {
                    const preset = CENTER_PRESETS.find((p) => p.label === data.optionValue);
                    if (preset) setDefaultCenter(preset);
                  }}
                >
                  {CENTER_PRESETS.map((preset) => (
                    <Option key={preset.label} text={preset.label} value={preset.label}>
                      {preset.label} ({preset.lat.toFixed(4)}, {preset.lng.toFixed(4)})
                    </Option>
                  ))}
                </Dropdown>
                <Divider />
                <Label>Custom coordinates</Label>
                <div className={styles.coordRow}>
                  <div className={styles.fieldGroup}>
                    <Label size="small">Latitude</Label>
                    <Input
                      type="number"
                      value={String(defaultCenter.lat)}
                      onChange={(_, data) => {
                        const lat = parseFloat(data.value);
                        if (!isNaN(lat)) setDefaultCenter({ ...defaultCenter, lat, label: "Custom" });
                      }}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <Label size="small">Longitude</Label>
                    <Input
                      type="number"
                      value={String(defaultCenter.lng)}
                      onChange={(_, data) => {
                        const lng = parseFloat(data.value);
                        if (!isNaN(lng)) setDefaultCenter({ ...defaultCenter, lng, label: "Custom" });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Map24Regular />}
                header={<Text weight="semibold">Language & Region</Text>}
                description="Map labels and localisation settings"
              />
              <div className={styles.cardContent}>
                <Label>Map language</Label>
                <Dropdown
                  value={LANGUAGE_OPTIONS.find((l) => l.value === defaultLanguage)?.label ?? ""}
                  onOptionSelect={(_, data) => {
                    const lang = LANGUAGE_OPTIONS.find((l) => l.label === data.optionText);
                    if (lang) setDefaultLanguage(lang.value);
                  }}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Option key={lang.value} value={lang.value}>
                      {lang.label}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Map24Regular />}
                header={<Text weight="semibold">Map Features</Text>}
                description="Toggle advanced map overlays and behaviors"
              />
              <div className={styles.cardContent}>
                <Switch
                  label="Weather overlay"
                  checked={showWeather}
                  onChange={(_, data) => setShowWeather(data.checked)}
                />
                <Switch
                  label="Points of interest (POI)"
                  checked={showPOIs}
                  onChange={(_, data) => setShowPOIs(data.checked)}
                />
                <Switch
                  label="Marker clustering"
                  checked={enableClustering}
                  onChange={(_, data) => setEnableClustering(data.checked)}
                />
                <Divider />
                <Label>Preferred travel mode</Label>
                <RadioGroup
                  value={preferredTravelMode}
                  onChange={(_, data) => setPreferredTravelMode(data.value as TravelMode)}
                >
                  <Radio value="car" label="Car" />
                  <Radio value="truck" label="Truck" />
                </RadioGroup>
              </div>
            </Card>
          </div>
        )}

        {/* ========== D365 F&O MCP Tab ========== */}
        {selectedTab === "d365" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<PlugConnected24Regular />}
                header={<Text weight="semibold">D365 Finance & Operations</Text>}
                description="MCP server connection for warehouse and shipment data"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={d365.foUrl && !d365.enableMock ? "success" : "warning"}
                    size="small"
                  >
                    {d365.foUrl && !d365.enableMock ? "Connected" : "Mock Mode"}
                  </Badge>
                  <Text size={200}>
                    {d365.foUrl && !d365.enableMock
                      ? "Live D365 F&O connection"
                      : "Using demo data"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>D365 F&O Environment URL</Label>
                  <Input
                    placeholder="https://your-org.operations.dynamics.com"
                    value={d365.foUrl}
                    onChange={(_, data) => updateD365({ foUrl: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Environment Name</Label>
                  <Input
                    placeholder="e.g. Production, Sandbox, UAT"
                    value={d365.environment}
                    onChange={(_, data) => updateD365({ environment: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Legal Entity</Label>
                  <Input
                    placeholder="e.g. USMF, DAT"
                    value={d365.legalEntity}
                    onChange={(_, data) => updateD365({ legalEntity: data.value })}
                  />
                </div>
                <Switch
                  label="Use mock data (demo mode)"
                  checked={d365.enableMock}
                  onChange={(_, data) => updateD365({ enableMock: data.checked })}
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">MCP Server Tools</Text>}
                description="Available D365 MCP operations"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Data Operations</Text>
                {[
                  "data_find_entity_type",
                  "data_get_entity_metadata",
                  "data_find_entities",
                  "data_create_entities",
                  "data_update_entities",
                ].map((tool) => (
                  <div key={tool} className={styles.statusBadge}>
                    <Checkmark24Regular />
                    <Text size={200}>{tool}</Text>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Supported Entities</Text>
                {[
                  "WHSShipmentTable — Shipments",
                  "InventLocationEntity — Warehouses",
                  "InventOnHandEntity — Inventory",
                ].map((entity) => (
                  <div key={entity} className={styles.statusBadge}>
                    <Database24Regular />
                    <Text size={200}>{entity}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ========== Dataverse Tab ========== */}
        {selectedTab === "dataverse" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<Database24Regular />}
                header={<Text weight="semibold">Dataverse Connection</Text>}
                description="Power Platform Dataverse for saved data and preferences"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={dataverse.url ? "success" : "warning"}
                    size="small"
                  >
                    {dataverse.url ? "Configured" : "Local Only"}
                  </Badge>
                  <Text size={200}>
                    {dataverse.url
                      ? "Syncing with Dataverse"
                      : "Using localStorage only"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>Dataverse Environment URL</Label>
                  <Input
                    placeholder="https://your-org.crm.dynamics.com"
                    value={dataverse.url}
                    onChange={(_, data) => updateDataverse({ url: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Azure AD Tenant ID</Label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={dataverse.tenantId}
                    onChange={(_, data) => updateDataverse({ tenantId: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Azure AD Client ID</Label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={dataverse.clientId}
                    onChange={(_, data) => updateDataverse({ clientId: data.value })}
                  />
                </div>
                <Switch
                  label="Sync on startup"
                  checked={dataverse.syncOnStartup}
                  onChange={(_, data) => updateDataverse({ syncOnStartup: data.checked })}
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">Synced Tables</Text>}
                description="Dataverse tables used for data persistence"
              />
              <div className={styles.cardContent}>
                {[
                  { table: "tiq_trafficincident", desc: "Traffic incidents and alerts" },
                  { table: "tiq_savedjourney", desc: "Saved journey routes" },
                  { table: "tiq_userpreference", desc: "User preferences and settings" },
                  { table: "tiq_notification", desc: "Notification history" },
                  { table: "tiq_routeoption", desc: "Route comparison history" },
                  { table: "tiq_shipment", desc: "Shipment data from D365 F&O" },
                  { table: "tiq_warehouse", desc: "Warehouse/facility data" },
                  { table: "tiq_fleetvehicle", desc: "Fleet vehicle tracking" },
                  { table: "tiq_workorder", desc: "Field service work orders" },
                  { table: "tiq_iotdevice", desc: "IoT device registry" },
                  { table: "tiq_chatthread", desc: "AI chat threads" },
                  { table: "tiq_appsetting", desc: "Runtime app settings" },
                  { table: "tiq_agentconfiguration", desc: "Agent config" },
                ].map((item) => (
                  <div key={item.table} className={styles.statusBadge}>
                    <Database24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.table}</Text>
                      <Text size={100}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ========== Dataverse MCP Tab ========== */}
        {selectedTab === "dataverse-mcp" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<PlugConnected24Regular />}
                header={<Text weight="semibold">Dataverse MCP Server</Text>}
                description="Model Context Protocol server for Dataverse & Field Service data"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={dataverseMcp.mcpUrl && !dataverseMcp.enableMock ? "success" : "warning"}
                    size="small"
                  >
                    {dataverseMcp.mcpUrl && !dataverseMcp.enableMock ? "Connected" : "Mock Mode"}
                  </Badge>
                  <Text size={200}>
                    {dataverseMcp.mcpUrl && !dataverseMcp.enableMock
                      ? "Live Dataverse MCP connection"
                      : "Using demo data — configure MCP server to connect"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>MCP Server URL</Label>
                  <Input
                    placeholder="http://localhost:3000 or https://your-mcp-server.azurewebsites.net"
                    value={dataverseMcp.mcpUrl}
                    onChange={(_, data) => updateDataverseMcp({ mcpUrl: data.value })}
                  />
                  <Text size={100}>
                    The Dataverse MCP server exposes Dataverse tables via the Model Context Protocol.
                    Field Service entities (work orders, bookings, assets) are accessed through this server.
                  </Text>
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Dataverse Environment URL</Label>
                  <Input
                    placeholder="https://your-org.crm.dynamics.com"
                    value={dataverseMcp.environmentUrl}
                    onChange={(_, data) => updateDataverseMcp({ environmentUrl: data.value })}
                  />
                  <Text size={100}>
                    The Dynamics 365 / Dataverse environment the MCP server connects to.
                  </Text>
                </div>
                <Switch
                  label="Use mock data (demo mode)"
                  checked={dataverseMcp.enableMock}
                  onChange={(_, data) => updateDataverseMcp({ enableMock: data.checked })}
                />
                <Divider />
                <Text size={200} weight="semibold">Module Toggles</Text>
                <Switch
                  label="Field Service (work orders, service requests, technicians)"
                  checked={dataverseMcp.enableFieldService}
                  onChange={(_, data) => updateDataverseMcp({ enableFieldService: data.checked })}
                />
                <Switch
                  label="Scheduling (bookable resources, bookings, schedule board)"
                  checked={dataverseMcp.enableScheduling}
                  onChange={(_, data) => updateDataverseMcp({ enableScheduling: data.checked })}
                />
                <Switch
                  label="Asset Management (customer assets, agreements, warranties)"
                  checked={dataverseMcp.enableAssetManagement}
                  onChange={(_, data) => updateDataverseMcp({ enableAssetManagement: data.checked })}
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">MCP Server Tools</Text>}
                description="Available Dataverse MCP operations"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Data Operations</Text>
                {[
                  "dataverse_query — Query Dataverse tables with OData filters",
                  "dataverse_get — Retrieve a single record by ID",
                  "dataverse_create — Create a new record in any table",
                  "dataverse_update — Update an existing record",
                  "dataverse_delete — Delete a record by ID",
                  "dataverse_metadata — Get table/column metadata",
                ].map((tool) => (
                  <div key={tool} className={styles.statusBadge}>
                    <Checkmark24Regular />
                    <Text size={200}>{tool}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Database24Regular />}
                header={<Text weight="semibold">Field Service Tables</Text>}
                description="D365 Field Service Dataverse tables accessible via MCP"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Work Order Management</Text>
                {[
                  { table: "msdyn_workorder", desc: "Work orders — service jobs at customer locations" },
                  { table: "msdyn_workorderproduct", desc: "Products used on a work order" },
                  { table: "msdyn_workorderservice", desc: "Services performed on a work order" },
                  { table: "msdyn_workorderservicetask", desc: "Service task checklist items" },
                  { table: "msdyn_workordertype", desc: "Work order type classification" },
                  { table: "msdyn_incidenttype", desc: "Incident types — templates for work orders" },
                  { table: "msdyn_servicetasktype", desc: "Service task type definitions" },
                ].map((item) => (
                  <div key={item.table} className={styles.statusBadge}>
                    <Database24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.table}</Text>
                      <Text size={100}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Scheduling & Resources</Text>
                {[
                  { table: "bookableresource", desc: "Technicians, equipment, and facilities" },
                  { table: "bookableresourcebooking", desc: "Scheduled time slots for resources" },
                  { table: "msdyn_resourcerequirement", desc: "Resource requirements for scheduling" },
                  { table: "msdyn_priority", desc: "Priority levels for work orders" },
                ].map((item) => (
                  <div key={item.table} className={styles.statusBadge}>
                    <Database24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.table}</Text>
                      <Text size={100}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Asset & Agreement Management</Text>
                {[
                  { table: "msdyn_customerasset", desc: "Customer equipment and asset tracking" },
                  { table: "msdyn_customerassetcategory", desc: "Asset category classification" },
                  { table: "msdyn_agreement", desc: "Service agreements and SLA contracts" },
                  { table: "msdyn_agreementbookingsetup", desc: "Recurring booking generation rules" },
                ].map((item) => (
                  <div key={item.table} className={styles.statusBadge}>
                    <Database24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.table}</Text>
                      <Text size={100}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Inventory & Purchasing</Text>
                {[
                  { table: "msdyn_warehouse", desc: "Warehouse and truck stock locations" },
                  { table: "msdyn_inventoryadjustment", desc: "Inventory level adjustments" },
                  { table: "msdyn_purchaseorder", desc: "Purchase orders for parts replenishment" },
                  { table: "msdyn_rma", desc: "Return merchandise authorizations" },
                ].map((item) => (
                  <div key={item.table} className={styles.statusBadge}>
                    <Database24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.table}</Text>
                      <Text size={100}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">Setup Guide</Text>}
                description="How to configure the Dataverse MCP server"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Prerequisites</Text>
                <Text size={100}>
                  1. A Dynamics 365 environment with Field Service installed{"\n"}
                  2. An Entra ID App Registration with Dataverse API permissions{"\n"}
                  3. The Dataverse MCP server running locally or deployed to Azure
                </Text>
                <Divider />
                <Text size={200} weight="semibold">MCP Server Configuration</Text>
                <Text size={100}>
                  The MCP server requires the following environment variables:{"\n"}
                  {"\n"}
                  DATAVERSE_URL — Your Dataverse environment URL{"\n"}
                  DATAVERSE_TENANT_ID — Azure AD tenant ID{"\n"}
                  DATAVERSE_CLIENT_ID — App registration client ID{"\n"}
                  DATAVERSE_CLIENT_SECRET — App registration secret{"\n"}
                  {"\n"}
                  The server authenticates using OAuth 2.0 client credentials flow
                  and exposes Dataverse tables as MCP tools for AI agent consumption.
                </Text>
                <Divider />
                <Text size={200} weight="semibold">Microsoft Docs Reference</Text>
                {[
                  "Field Service Overview — learn.microsoft.com/dynamics365/field-service/overview",
                  "Work Order Architecture — learn.microsoft.com/dynamics365/field-service/field-service-architecture",
                  "Entity Reference — learn.microsoft.com/dynamics365/field-service/developer/reference/about-entity-reference",
                  "Dataverse Web API — learn.microsoft.com/power-apps/developer/data-platform/webapi/overview",
                ].map((ref) => (
                  <div key={ref} className={styles.statusBadge}>
                    <Info24Regular />
                    <Text size={100}>{ref}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ========== Email Tab ========== */}
        {selectedTab === "email" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<Mail24Regular />}
                header={<Text weight="semibold">Email Configuration</Text>}
                description="Connect mailbox for sending alerts and reports"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={email.flowUrl ? "success" : "warning"}
                    size="small"
                  >
                    {email.flowUrl ? "Connected" : "Not Configured"}
                  </Badge>
                  <Text size={200}>
                    {email.flowUrl
                      ? "Power Automate email flow active"
                      : "Configure Power Automate HTTP trigger URL"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>Power Automate HTTP Trigger URL</Label>
                  <Input
                    placeholder="https://prod-xx.westeurope.logic.azure.com/workflows/..."
                    value={email.flowUrl}
                    onChange={(_, data) => updateEmail({ flowUrl: data.value })}
                  />
                  <Text size={100}>
                    Create a Power Automate flow with HTTP trigger that sends emails via Office 365 connector.
                  </Text>
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Default Recipient</Label>
                  <Input
                    placeholder="logistics@company.com"
                    type="email"
                    value={email.defaultRecipient}
                    onChange={(_, data) => updateEmail({ defaultRecipient: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Sender Display Name</Label>
                  <Input
                    placeholder="TrafficIQ Alerts"
                    value={email.senderName}
                    onChange={(_, data) => updateEmail({ senderName: data.value })}
                  />
                </div>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Mail24Regular />}
                header={<Text weight="semibold">Email Triggers</Text>}
                description="Choose which events send email notifications"
              />
              <div className={styles.cardContent}>
                <Switch
                  label="Traffic delay alerts"
                  checked={email.enableAlertEmails}
                  onChange={(_, data) => updateEmail({ enableAlertEmails: data.checked })}
                />
                <Text size={100}>
                  Send an email when traffic delays exceed thresholds on monitored routes.
                </Text>
                <Divider />
                <Switch
                  label="Shipment status updates"
                  checked={email.enableShipmentEmails}
                  onChange={(_, data) => updateEmail({ enableShipmentEmails: data.checked })}
                />
                <Text size={100}>
                  Send an email when shipment status changes (delayed, delivered, etc.)
                </Text>
              </div>
            </Card>
          </div>
        )}

        {/* ========== IoT Hub Tab ========== */}
        {selectedTab === "iothub" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<PlugConnected24Regular />}
                header={<Text weight="semibold">Azure IoT Hub</Text>}
                description="IoT device management and telemetry for fleet GPS tracking"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={iotHub.hostname && !iotHub.enableMock ? "success" : "warning"}
                    size="small"
                  >
                    {iotHub.hostname && !iotHub.enableMock ? "Connected" : "Mock Mode"}
                  </Badge>
                  <Text size={200}>
                    {iotHub.hostname && !iotHub.enableMock
                      ? "Live IoT Hub connection"
                      : "Using demo device data"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>IoT Hub Hostname</Label>
                  <Input
                    placeholder="your-hub.azure-devices.net"
                    value={iotHub.hostname}
                    onChange={(_, data) => updateIotHub({ hostname: data.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <Label>Shared Access Signature (SAS) Token</Label>
                  <Input
                    type="password"
                    placeholder="SharedAccessSignature sr=..."
                    value={iotHub.sasToken}
                    onChange={(_, data) => updateIotHub({ sasToken: data.value })}
                  />
                  <Text size={100}>
                    Generate from Azure Portal &gt; IoT Hub &gt; Shared access policies &gt; iothubowner.
                  </Text>
                </div>
                <Switch
                  label="Use mock data (demo mode)"
                  checked={iotHub.enableMock}
                  onChange={(_, data) => updateIotHub({ enableMock: data.checked })}
                />
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">IoT Hub Capabilities</Text>}
                description="Available IoT device management and monitoring features"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Device Management</Text>
                {[
                  "GPS device status & health monitoring",
                  "Signal strength & battery level tracking",
                  "Firmware version monitoring",
                  "Device heartbeat & connectivity status",
                ].map((item) => (
                  <div key={item} className={styles.statusBadge}>
                    <Checkmark24Regular />
                    <Text size={200}>{item}</Text>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Geofencing & Alerts</Text>
                {[
                  "Warehouse zone geofence entry/exit",
                  "Driving behavior alerts (speeding, braking, idling)",
                  "Route deviation detection",
                  "Device connectivity alerts",
                ].map((item) => (
                  <div key={item} className={styles.statusBadge}>
                    <Checkmark24Regular />
                    <Text size={200}>{item}</Text>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Registered Devices (Demo)</Text>
                {[
                  "IOT-GPS-001 — TRK-101 (Teltonika FMC130)",
                  "IOT-GPS-002 — TRK-102 (Teltonika FMC130)",
                  "IOT-GPS-003 — TRK-103 (Queclink GV300)",
                  "IOT-GPS-004 — TRK-104 (Teltonika FMC130)",
                  "IOT-GPS-005 — TRK-105 (Queclink GV300)",
                  "IOT-GPS-006 — VAN-201 (CalAmp LMU-4233)",
                ].map((device) => (
                  <div key={device} className={styles.statusBadge}>
                    <Database24Regular />
                    <Text size={200}>{device}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ========== Key Vault Tab ========== */}
        {selectedTab === "keyvault" && (
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader
                image={<ShieldLock24Regular />}
                header={<Text weight="semibold">Azure Key Vault</Text>}
                description="Centralized secret management via Azure Key Vault"
              />
              <div className={styles.cardContent}>
                <div className={styles.statusBadge}>
                  <Badge
                    appearance="filled"
                    color={import.meta.env.VITE_AZURE_OPENAI_KEY ? "success" : "warning"}
                    size="small"
                  >
                    {import.meta.env.VITE_AZURE_OPENAI_KEY ? "Active" : "Not Configured"}
                  </Badge>
                  <Text size={200}>
                    {import.meta.env.VITE_AZURE_OPENAI_KEY
                      ? "Secrets loaded from Key Vault"
                      : "Using .env file fallback"}
                  </Text>
                </div>
                <Divider />
                <div className={styles.fieldGroup}>
                  <Label>Key Vault URL</Label>
                  <Input
                    readOnly
                    value={import.meta.env.VITE_AZURE_KEY_VAULT_URL || "Not configured — set AZURE_KEY_VAULT_URL in .env"}
                  />
                  <Text size={100}>
                    Secrets are loaded at build/startup via the Vite Key Vault plugin.
                    Authentication uses DefaultAzureCredential (az login or managed identity).
                  </Text>
                </div>
                <Divider />
                <Text size={200} weight="semibold">How it works</Text>
                <Text size={100}>
                  1. Set AZURE_KEY_VAULT_URL in your .env file{"\n"}
                  2. Run "az login" to authenticate{"\n"}
                  3. Restart the dev server — secrets are fetched automatically{"\n"}
                  4. Deploy script: .\scripts\deploy-azure.ps1 provisions Key Vault and seeds secrets
                </Text>
              </div>
            </Card>

            <Card className={styles.card}>
              <CardHeader
                image={<Info24Regular />}
                header={<Text weight="semibold">Managed Secrets</Text>}
                description="Key Vault secret mappings and their current status"
              />
              <div className={styles.cardContent}>
                <Text size={200} weight="semibold">Frontend Secrets (VITE_)</Text>
                {([
                  { secret: "agent-endpoint", env: "VITE_AGENT_ENDPOINT", value: import.meta.env.VITE_AGENT_ENDPOINT },
                  { secret: "agent-api-key", env: "VITE_AGENT_API_KEY", value: import.meta.env.VITE_AGENT_API_KEY },
                  { secret: "agent-model-deployment", env: "VITE_AGENT_MODEL_DEPLOYMENT", value: import.meta.env.VITE_AGENT_MODEL_DEPLOYMENT },
                  { secret: "azure-openai-endpoint", env: "VITE_AZURE_OPENAI_ENDPOINT", value: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT },
                  { secret: "azure-openai-key", env: "VITE_AZURE_OPENAI_KEY", value: import.meta.env.VITE_AZURE_OPENAI_KEY },
                  { secret: "azure-openai-deployment", env: "VITE_AZURE_OPENAI_DEPLOYMENT", value: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT },
                  { secret: "azure-maps-key", env: "VITE_AZURE_MAPS_KEY", value: import.meta.env.VITE_AZURE_MAPS_KEY },
                  { secret: "vapid-public-key", env: "VITE_VAPID_PUBLIC_KEY", value: import.meta.env.VITE_VAPID_PUBLIC_KEY },
                  { secret: "email-flow-url", env: "VITE_EMAIL_FLOW_URL", value: import.meta.env.VITE_EMAIL_FLOW_URL },
                  { secret: "dataverse-browser-url", env: "VITE_DATAVERSE_URL", value: import.meta.env.VITE_DATAVERSE_URL },
                  { secret: "d365-fo-url", env: "VITE_D365_FO_URL", value: import.meta.env.VITE_D365_FO_URL },
                  { secret: "iot-hub-hostname", env: "VITE_IOT_HUB_HOSTNAME", value: import.meta.env.VITE_IOT_HUB_HOSTNAME },
                  { secret: "iot-hub-sas-token", env: "VITE_IOT_HUB_SAS_TOKEN", value: import.meta.env.VITE_IOT_HUB_SAS_TOKEN },
                  { secret: "dataverse-mcp-url", env: "VITE_DATAVERSE_MCP_URL", value: import.meta.env.VITE_DATAVERSE_MCP_URL },
                ] as { secret: string; env: string; value: string | undefined }[]).map((item) => (
                  <div key={item.secret} className={styles.statusBadge}>
                    {item.value ? <Checkmark24Regular /> : <Dismiss24Regular />}
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.secret}</Text>
                      <Text size={100}>
                        {item.env} — {item.value ? "Set" : "Not set"}
                      </Text>
                    </div>
                  </div>
                ))}
                <Divider />
                <Text size={200} weight="semibold">Server-only Secrets</Text>
                {[
                  { secret: "dataverse-url", env: "DATAVERSE_URL" },
                  { secret: "dataverse-tenant-id", env: "DATAVERSE_TENANT_ID" },
                  { secret: "dataverse-client-id", env: "DATAVERSE_CLIENT_ID" },
                  { secret: "dataverse-client-secret", env: "DATAVERSE_CLIENT_SECRET" },
                ].map((item) => (
                  <div key={item.secret} className={styles.statusBadge}>
                    <ShieldLock24Regular />
                    <div className={styles.fieldGroup}>
                      <Text size={200} weight="semibold">{item.secret}</Text>
                      <Text size={100}>
                        {item.env} — Server-side only (not exposed to browser)
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ========== Agents Tab ========== */}
        {selectedTab === "agents" && (
          <>
            <div className={styles.grid}>
              {/* Azure AI Foundry Connection */}
              <Card className={styles.card}>
                <CardHeader
                  image={<BotSparkle24Regular />}
                  header={<Text weight="semibold">Azure AI Foundry Connection</Text>}
                  description="Agent backend powered by Azure OpenAI Assistants API"
                />
                <div className={styles.cardContent}>
                  <div className={styles.statusBadge}>
                    <Badge
                      appearance="filled"
                      color={import.meta.env.VITE_AZURE_OPENAI_KEY ? "success" : "warning"}
                      size="small"
                    >
                      {import.meta.env.VITE_AZURE_OPENAI_KEY ? "Connected" : "Not Configured"}
                    </Badge>
                    <Text size={200}>
                      {import.meta.env.VITE_AZURE_OPENAI_KEY
                        ? "Azure OpenAI Assistants API active"
                        : "Set VITE_AZURE_OPENAI_KEY in .env"}
                    </Text>
                  </div>
                  <Divider />
                  <div className={styles.fieldGroup}>
                    <Label>Azure OpenAI Endpoint</Label>
                    <Input
                      readOnly
                      value={import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "Not configured"}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <Label>Model Deployment</Label>
                    <Input
                      readOnly
                      value={import.meta.env.VITE_AGENT_MODEL_DEPLOYMENT || import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4o"}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <Label>API Key</Label>
                    <Input
                      readOnly
                      value={import.meta.env.VITE_AZURE_OPENAI_KEY ? "••••••••" + (import.meta.env.VITE_AZURE_OPENAI_KEY as string).slice(-6) : "Not set"}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <Label>Total Specialist Agents</Label>
                    <Text size={300} weight="semibold">
                      {SPECIALIST_DOMAINS.length} agents ({Object.values(agentSettings.enabledAgents).filter(Boolean).length} enabled)
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Routing Configuration */}
              <Card className={styles.card}>
                <CardHeader
                  image={<Settings24Regular />}
                  header={<Text weight="semibold">Routing Configuration</Text>}
                  description="How messages are classified and routed to agents"
                />
                <div className={styles.cardContent}>
                  <Text size={200} weight="semibold">Three-Tier Routing Pipeline</Text>
                  <div className={styles.routingTier}>
                    <Badge appearance="filled" color="brand" size="small">Tier 1</Badge>
                    <Text size={200}>Sticky Routing</Text>
                    <Text className={styles.routingArrow}>→</Text>
                    <Badge appearance="filled" color="brand" size="small">Tier 2</Badge>
                    <Text size={200}>Keyword Match</Text>
                    <Text className={styles.routingArrow}>→</Text>
                    <Badge appearance="filled" color="brand" size="small">Tier 3</Badge>
                    <Text size={200}>LLM Router</Text>
                  </div>
                  <Divider />
                  <div className={styles.fieldGroup}>
                    <Label>Default Fallback Agent</Label>
                    <Dropdown
                      value={AGENT_CONFIGS[agentSettings.defaultFallback as Exclude<AgentDomain, "orchestrator">]?.displayName || "Supply Chain"}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) updateAgentSettings({ defaultFallback: data.optionValue });
                      }}
                    >
                      {SPECIALIST_DOMAINS.map((d) => (
                        <Option key={d} value={d} text={AGENT_CONFIGS[d].displayName}>
                          {AGENT_CONFIGS[d].displayName}
                        </Option>
                      ))}
                    </Dropdown>
                    <Text size={100}>
                      Used when the LLM router cannot determine a domain with confidence.
                    </Text>
                  </div>
                  <div className={styles.fieldGroup}>
                    <Label>Sticky Routing Max Words: {agentSettings.stickyMaxWords}</Label>
                    <Slider
                      min={2}
                      max={12}
                      value={agentSettings.stickyMaxWords}
                      onChange={(_, data) => updateAgentSettings({ stickyMaxWords: data.value })}
                    />
                    <Text size={100}>
                      Short follow-up messages (under this word count) stay with the current agent.
                    </Text>
                  </div>
                </div>
              </Card>
            </div>

            {/* Per-Agent Cards */}
            <Divider style={{ margin: "8px 0" }} />
            <Text size={400} weight="semibold">Specialist Agents</Text>
            <Text size={200}>Configure each agent's availability, model, tools, and routing keywords</Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: tokens.spacingHorizontalL, marginTop: tokens.spacingVerticalS }}>
              {agentSettings.agentOrder.map((domain, idx) => {
                const config = AGENT_CONFIGS[domain as Exclude<AgentDomain, "orchestrator">];
                if (!config) return null;
                const tools = DOMAIN_TOOLS[domain as Exclude<AgentDomain, "orchestrator">] || [];
                const domainSpecificTools = tools.filter(t => !["navigate_to_page", "show_input_form"].includes(t.function.name));
                const sharedTools = tools.filter(t => ["navigate_to_page", "show_input_form"].includes(t.function.name));
                const allKeywords = [...config.keywords, ...(agentSettings.keywordAdditions[domain] || [])];
                const isEnabled = agentSettings.enabledAgents[domain] !== false;

                return (
                  <Card key={domain} className={styles.agentCard}>
                    {/* Color bar */}
                    <div style={{ height: "3px", backgroundColor: config.color }} />
                    <div className={styles.cardContent}>
                      {/* Header: icon + name + toggle */}
                      <div className={styles.agentHeader}>
                        <div className={styles.agentHeaderLeft}>
                          <div
                            className={styles.agentIconBox}
                            style={{ backgroundColor: config.color }}
                          >
                            <AgentIconForDomain domain={domain} />
                          </div>
                          <div className={styles.agentMeta}>
                            <Text weight="semibold" size={300} truncate wrap={false}>{config.displayName}</Text>
                            <Text size={100} truncate wrap={false}>{config.subtitle}</Text>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <div className={styles.orderButtons}>
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<ArrowUp16Regular />}
                              disabled={idx === 0}
                              onClick={() => moveAgent(domain, "up")}
                            />
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<ArrowDown16Regular />}
                              disabled={idx === agentSettings.agentOrder.length - 1}
                              onClick={() => moveAgent(domain, "down")}
                            />
                          </div>
                          <Switch
                            checked={isEnabled}
                            onChange={() => toggleAgent(domain)}
                          />
                        </div>
                      </div>

                      <Divider />

                      {/* Model Override */}
                      <div className={styles.fieldGroup}>
                        <Label size="small">Model Deployment</Label>
                        <Dropdown
                          size="small"
                          placeholder="Use global default"
                          value={MODEL_DEPLOYMENT_OPTIONS.find(o => o.value === (agentSettings.modelOverrides[domain] || ""))?.label || "Use global default"}
                          onOptionSelect={(_, data) =>
                            updateAgentSettings({
                              modelOverrides: { ...agentSettings.modelOverrides, [domain]: data.optionValue || "" },
                            })
                          }
                        >
                          {MODEL_DEPLOYMENT_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value} text={opt.label}>
                              {opt.label}
                            </Option>
                          ))}
                        </Dropdown>
                      </div>

                      {/* Tools */}
                      <div className={styles.fieldGroup}>
                        <Label size="small">
                          Tools
                          <Badge appearance="filled" size="small" color="informative" style={{ marginLeft: "6px" }}>
                            {domainSpecificTools.length} domain + {sharedTools.length} shared
                          </Badge>
                        </Label>
                        <div className={styles.toolsGrid}>
                          {domainSpecificTools.map((t) => (
                            <span key={t.function.name} className={styles.toolChip}>
                              {t.function.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div className={styles.fieldGroup}>
                        <Label size="small">
                          Routing Keywords
                          <Badge appearance="filled" size="small" color="informative" style={{ marginLeft: "6px" }}>
                            {allKeywords.length}
                          </Badge>
                        </Label>
                        <div className={styles.keywordsGrid}>
                          {config.keywords.map((kw) => (
                            <span key={kw} className={styles.keywordChip}>
                              {kw}
                            </span>
                          ))}
                          {(agentSettings.keywordAdditions[domain] || []).map((kw) => (
                            <span key={`custom-${kw}`} className={styles.keywordChip} style={{ backgroundColor: config.color + "22", borderColor: config.color }}>
                              {kw}
                              <span
                                className={styles.keywordDismiss}
                                onClick={() => removeKeywordFromAgent(domain, kw)}
                              >
                                <DismissCircle16Regular />
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className={styles.addKeywordRow}>
                          <Input
                            size="small"
                            placeholder="Add keyword..."
                            value={newKeyword[domain] || ""}
                            onChange={(_, data) => setNewKeyword((prev) => ({ ...prev, [domain]: data.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addKeywordToAgent(domain, newKeyword[domain] || "");
                              }
                            }}
                            style={{ flex: 1 }}
                          />
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Add16Regular />}
                            onClick={() => addKeywordToAgent(domain, newKeyword[domain] || "")}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={clearDialogOpen}
        title="Clear All Data"
        message="Are you sure you want to clear all saved journeys, settings, and notification history? This action cannot be undone."
        confirmLabel="Clear Data"
        onConfirm={handleClearData}
        onCancel={() => setClearDialogOpen(false)}
      />
    </div>
  );
}
