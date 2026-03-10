import { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Badge,
  shorthands,
  TabList,
  Tab,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Warning20Regular,
  Bookmark20Regular,
  ChevronUp20Regular,
  ChevronDown20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { TrafficMap } from "../components/map/TrafficMap";
import { TrafficSummary } from "../components/traffic/TrafficSummary";
import { IncidentList } from "../components/traffic/IncidentList";
import { SavedJourneyList } from "../components/saved/SavedJourneyList";
import { useTrafficOverview } from "../hooks/useAgent";
import {
  useSavedJourneys,
  useDeleteJourney,
  useUpdateJourney,
} from "../hooks/useJourneys";
import { useTrafficAlerts } from "../hooks/useTrafficAlerts";
import { useJourneyContext } from "../context/JourneyContext";
import { useMapSettings } from "../context/MapSettingsContext";
import type { MapBounds, LocationWeather, PointOfInterest } from "../types/map";
import type { SavedJourney } from "../types/journey";
import { ROUTES } from "../config/routes";
import { getWeatherForecast, searchPOI } from "../services/azureMapsService";

const useStyles = makeStyles({
  root: {
    position: "relative",
    height: "100%",
    overflow: "hidden",
  },
  mapLayer: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
  },
  overlayLayer: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topOverlays: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    gap: tokens.spacingHorizontalL,
  },
  glassCard: {
    pointerEvents: "auto",
    backgroundColor: "var(--glass-surface)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid var(--glass-border)`,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    animationName: {
      from: { opacity: 0, transform: "translateY(-8px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    animationDuration: "350ms",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
  },
  welcomeCard: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    maxWidth: "360px",
  },
  welcomeTitle: {
    display: "block",
  },
  welcomeSubtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
    display: "block",
  },
  trafficOverlay: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    minWidth: "200px",
  },
  bottomTray: {
    pointerEvents: "auto",
    backgroundColor: "var(--glass-surface)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid var(--glass-border)`,
    borderTopLeftRadius: tokens.borderRadiusXLarge,
    borderTopRightRadius: tokens.borderRadiusXLarge,
    borderBottomLeftRadius: "0",
    borderBottomRightRadius: "0",
    boxShadow: tokens.shadow28,
    ...shorthands.margin("0", tokens.spacingHorizontalL),
    display: "flex",
    flexDirection: "column",
    transitionProperty: "max-height",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
    overflow: "hidden",
  },
  trayExpanded: {
    maxHeight: "300px",
  },
  trayCollapsed: {
    maxHeight: "44px",
  },
  trayHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    flexShrink: 0,
  },
  trayToggle: {
    minWidth: "unset",
  },
  trayContent: {
    flex: 1,
    overflowY: "auto",
    ...shorthands.padding("0", tokens.spacingHorizontalM, tokens.spacingVerticalS),
  },
  incidentBadge: {
    marginLeft: tokens.spacingHorizontalXS,
  },
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [trayOpen, setTrayOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("incidents");
  const { showWeather, showPOIs } = useMapSettings();
  const [weatherData, setWeatherData] = useState<LocationWeather[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);

  const { clearPlannedJourney, clearActiveJourney } = useJourneyContext();
  const { data: trafficData, isLoading: trafficLoading } =
    useTrafficOverview(bounds);
  const { data: savedJourneys = [] } = useSavedJourneys();
  const deleteJourney = useDeleteJourney();
  const updateJourney = useUpdateJourney();

  // Clear stale journey planner state when returning to dashboard
  useEffect(() => {
    clearPlannedJourney();
    clearActiveJourney();
  }, [clearPlannedJourney, clearActiveJourney]);

  useTrafficAlerts(trafficData?.incidents, "traffic-toaster");

  // Fetch weather overlay data when enabled (key Danish cities)
  useEffect(() => {
    if (!showWeather) { setWeatherData([]); return; }
    const locations = [
      { lat: 55.68, lng: 12.57 },  // Copenhagen
      { lat: 56.16, lng: 10.20 },  // Aarhus
      { lat: 55.40, lng: 10.39 },  // Odense
    ];
    getWeatherForecast({ locations }).then(setWeatherData).catch(() => setWeatherData([]));
  }, [showWeather]);

  // Fetch POI data when enabled
  useEffect(() => {
    if (!showPOIs) { setPois([]); return; }
    searchPOI({ center: { lat: 55.68, lng: 12.57 }, radiusMeters: 100000, limit: 10 })
      .then(setPois).catch(() => setPois([]));
  }, [showPOIs]);

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleNavigateJourney = (journey: SavedJourney) => {
    navigate(ROUTES.JOURNEY_PLANNER, {
      state: { origin: journey.origin, destination: journey.destination },
    });
  };

  const handleToggleMorningAlert = (journey: SavedJourney) => {
    const updated = {
      ...journey,
      morningAlert: journey.morningAlert
        ? { ...journey.morningAlert, enabled: !journey.morningAlert.enabled }
        : {
            enabled: true,
            time: "07:00",
            daysOfWeek: [1, 2, 3, 4, 5],
            pushEnabled: true,
            emailEnabled: false,
          },
    };
    updateJourney.mutate(updated);
  };

  const incidentCount = trafficData?.incidents?.length ?? 0;

  return (
    <div className={styles.root}>
      {/* Full-bleed map background */}
      <div className={styles.mapLayer}>
        <TrafficMap
          incidents={trafficData?.incidents}
          onBoundsChange={handleBoundsChange}
          weatherData={weatherData}
          pois={pois}
        />
      </div>

      {/* Floating overlays */}
      <div className={styles.overlayLayer}>
        {/* Top row: greeting + traffic stats */}
        <div className={styles.topOverlays}>
          <div className={mergeClasses(styles.glassCard, styles.welcomeCard)}>
            <Text size={500} weight="semibold" className={styles.welcomeTitle}>
              {getGreeting()}
            </Text>
            <Text size={300} className={styles.welcomeSubtitle}>
              {incidentCount > 0
                ? `${incidentCount} active incident${incidentCount !== 1 ? "s" : ""} affecting delivery routes`
                : "All delivery routes are clear. Operations running smoothly."}
            </Text>
          </div>

          <div className={mergeClasses(styles.glassCard, styles.trafficOverlay)}>
            <TrafficSummary
              summary={trafficData?.summary}
              isLoading={trafficLoading}
              compact
            />
          </div>
        </div>

        {/* Bottom tray: Incidents / Saved Journeys */}
        <div
          className={mergeClasses(
            styles.bottomTray,
            trayOpen ? styles.trayExpanded : styles.trayCollapsed
          )}
        >
          <div className={styles.trayHeader}>
            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, d) => {
                setActiveTab(d.value as string);
                if (!trayOpen) setTrayOpen(true);
              }}
              size="small"
            >
              <Tab value="incidents" icon={<Warning20Regular />}>
                Incidents
                {incidentCount > 0 && (
                  <Badge
                    size="small"
                    appearance="filled"
                    color="danger"
                    className={styles.incidentBadge}
                  >
                    {incidentCount}
                  </Badge>
                )}
              </Tab>
              <Tab value="saved" icon={<Bookmark20Regular />}>
                Saved Journeys
              </Tab>
            </TabList>
            <Button
              appearance="subtle"
              size="small"
              icon={trayOpen ? <ChevronDown20Regular /> : <ChevronUp20Regular />}
              onClick={() => setTrayOpen((p) => !p)}
              className={styles.trayToggle}
            />
          </div>
          <div className={styles.trayContent}>
            {activeTab === "incidents" ? (
              <IncidentList
                incidents={trafficData?.incidents ?? []}
                isLoading={trafficLoading}
                maxItems={5}
                compact
              />
            ) : (
              <SavedJourneyList
                journeys={savedJourneys}
                onNavigate={handleNavigateJourney}
                onDelete={(id) => deleteJourney.mutate(id)}
                onToggleMorningAlert={handleToggleMorningAlert}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
