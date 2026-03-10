import { useState, useEffect, useRef } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Card,
  shorthands,
} from "@fluentui/react-components";
import { Sparkle20Regular } from "@fluentui/react-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { TrafficMap } from "../components/map/TrafficMap";
import { JourneyForm } from "../components/journey/JourneyForm";
import { RouteOptionsList } from "../components/journey/RouteOptionsList";
import { SaveJourneyDialog } from "../components/journey/SaveJourneyDialog";
import { usePlanJourney } from "../hooks/useAgent";
import { useSaveJourney } from "../hooks/useJourneys";
import { useJourneyContext } from "../context/JourneyContext";
import { useMapSettings } from "../context/MapSettingsContext";
import { journeyDetailsPath } from "../config/routes";
import type { Location, JourneyPreferences, RouteOption } from "../types/journey";
import type { LocationWeather, PointOfInterest } from "../types/map";
import { getWeatherForecast, searchPOI } from "../services/azureMapsService";

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
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalM,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  mapPanel: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.overflow("hidden"),
    boxShadow: tokens.shadow4,
    minHeight: "500px",
    border: "1px solid " + tokens.colorNeutralStroke2,
  },
  recommendationsCard: {
    ...shorthands.padding(tokens.spacingVerticalM),
    borderLeft: "3px solid " + tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusXLarge,
  },
  recommendationsHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  recommendationsIcon: {
    color: tokens.colorBrandForeground1,
  },
  recommendationsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  recommendationItem: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
  },
});

export function JourneyPlannerPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const planJourney = usePlanJourney();
  const saveJourney = useSaveJourney();
  const { setActiveJourney, plannedJourney, setPlannedJourney, clearPlannedJourney } = useJourneyContext();

  // If navigating here fresh (not via saved-journey link with state), clear stale results
  const locationState = location.state as { origin?: Location; destination?: Location } | null;
  const [hasCleared, setHasCleared] = useState(false);

  useEffect(() => {
    if (!hasCleared && !locationState?.origin && !plannedJourney?.routes?.length) {
      clearPlannedJourney();
      setHasCleared(true);
    }
  }, [hasCleared, locationState, plannedJourney, clearPlannedJourney]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [origin, setOrigin] = useState<Location | null>(plannedJourney?.origin ?? locationState?.origin ?? null);
  const [destination, setDestination] = useState<Location | null>(plannedJourney?.destination ?? locationState?.destination ?? null);
  const { showWeather, showPOIs } = useMapSettings();
  const [weatherData, setWeatherData] = useState<LocationWeather[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);

  // Sync local origin/destination when context is set externally (e.g. by chat agent)
  useEffect(() => {
    if (plannedJourney?.origin && !origin) {
      setOrigin(plannedJourney.origin);
    }
    if (plannedJourney?.destination && !destination) {
      setDestination(plannedJourney.destination);
    }
  }, [plannedJourney, origin, destination]);

  // Use either fresh mutation results or restored context results
  const routes = planJourney.data?.routes ?? plannedJourney?.routes ?? [];
  const recommendations = planJourney.data?.recommendations ?? plannedJourney?.recommendations ?? [];

  // Fetch weather overlay data when enabled
  useEffect(() => {
    if (!showWeather) { setWeatherData([]); return; }
    const locations = origin && destination
      ? [origin.coordinates, destination.coordinates]
      : [{ lat: 55.68, lng: 12.57 }, { lat: 56.16, lng: 10.20 }];
    getWeatherForecast({ locations }).then(setWeatherData).catch(() => setWeatherData([]));
  }, [showWeather, origin, destination]);

  // Fetch POI data when enabled
  useEffect(() => {
    if (!showPOIs) { setPois([]); return; }
    const center = origin?.coordinates ?? { lat: 55.68, lng: 12.57 };
    searchPOI({ center, radiusMeters: 50000, limit: 10 })
      .then(setPois).catch(() => setPois([]));
  }, [showPOIs, origin]);

  // Persist results to context when mutation succeeds
  useEffect(() => {
    if (planJourney.data && origin && destination) {
      setPlannedJourney({
        origin,
        destination,
        routes: planJourney.data.routes,
        recommendations: planJourney.data.recommendations ?? [],
      });
    }
  }, [planJourney.data, origin, destination, setPlannedJourney]);

  // Auto-plan route when navigating from Saved Journeys (locationState has origin+destination but no routes yet)
  const hasAutoPlanned = useRef(false);
  useEffect(() => {
    if (
      !hasAutoPlanned.current &&
      locationState?.origin &&
      locationState?.destination &&
      !plannedJourney?.routes?.length &&
      !planJourney.isPending
    ) {
      hasAutoPlanned.current = true;
      setOrigin(locationState.origin);
      setDestination(locationState.destination);
      planJourney.mutate({
        origin: locationState.origin,
        destination: locationState.destination,
        preferences: { transportMode: "car", avoidTolls: false, avoidHighways: false },
      });
    }
  }, [locationState, plannedJourney, planJourney]);

  const handleSubmit = (
    orig: Location,
    dest: Location,
    departureTime: string | undefined,
    preferences: JourneyPreferences
  ) => {
    clearPlannedJourney();
    setOrigin(orig);
    setDestination(dest);
    setSelectedRouteId(undefined);
    planJourney.mutate({
      origin: orig,
      destination: dest,
      departureTime,
      preferences,
    });
  };

  const handleSelectRoute = (route: RouteOption) => {
    if (selectedRouteId === route.id) {
      // Already selected — navigate to details
      setActiveJourney(route);
      navigate(journeyDetailsPath(route.id));
    } else {
      // First click — highlight on map
      setSelectedRouteId(route.id);
    }
  };

  const handleSaveRoute = () => {
    setSaveDialogOpen(true);
  };

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Plan Journey
        </Text>
        <Text size={200}>
          Enter origin and destination to find the best routes with real-time traffic
        </Text>
      </div>
      <div className={styles.content}>
        <div className={styles.formPanel}>
          <JourneyForm
            onSubmit={handleSubmit}
            isLoading={planJourney.isPending}
            initialOrigin={plannedJourney?.origin ?? locationState?.origin}
            initialDestination={plannedJourney?.destination ?? locationState?.destination}
          />
          {routes.length > 0 && (
            <RouteOptionsList
              routes={routes}
              selectedRouteId={selectedRouteId}
              origin={origin}
              destination={destination}
              onSelectRoute={handleSelectRoute}
              onSaveRoute={handleSaveRoute}
            />
          )}
          {recommendations.length > 0 && (
            <Card className={styles.recommendationsCard}>
              <div className={styles.recommendationsHeader}>
                <Sparkle20Regular className={styles.recommendationsIcon} />
                <Text weight="semibold" size={300}>
                  Agent Recommendations
                </Text>
              </div>
              <div className={styles.recommendationsList}>
                {recommendations.map((rec, i) => (
                  <div key={i} className={styles.recommendationItem}>
                    <Text size={200}>{rec}</Text>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className={styles.mapPanel}>
          <TrafficMap
            routes={routes}
            selectedRouteId={selectedRouteId}
            incidents={planJourney.data?.trafficIncidents}
            weatherData={weatherData}
            pois={pois}
          />
        </div>
      </div>

      {saveDialogOpen && origin && destination && (
        <SaveJourneyDialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          origin={origin}
          destination={destination}
          onSave={(name, morningAlert) => {
            saveJourney.mutate({
              name,
              origin,
              destination,
              preferences: {
                avoidTolls: false,
                avoidHighways: false,
                transportMode: "car",
              },
              morningAlert,
            });
          }}
        />
      )}
    </div>
  );
}
