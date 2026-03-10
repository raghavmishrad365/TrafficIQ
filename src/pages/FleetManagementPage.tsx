import { useState, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  Badge,
  CounterBadge,
  Spinner,
  ProgressBar,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  VehicleCar24Regular,
  TopSpeed24Regular,
  GasPump24Regular,
  Clock24Regular,
  Map24Regular,
  Grid24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { FleetVehicle, FleetVehicleStatus } from "../types/supplychain";
import type { LocationWeather } from "../types/map";
import { FleetMap } from "../components/map/FleetMap";
import { useMapSettings } from "../context/MapSettingsContext";
import { getWeatherForecast } from "../services/azureMapsService";

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
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  statCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  statIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIconTotal: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  statIconActive: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconIdle: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconMaint: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  vehicleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  vehicleCard: {
    borderRadius: tokens.borderRadiusXLarge,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow8 },
  },
  vehicleCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  vehicleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleId: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  metricRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  metricItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  metricIcon: {
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
  },
  progressRow: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  mapContainer: {
    height: "500px",
    borderRadius: tokens.borderRadiusXLarge,
    overflow: "hidden",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

function getStatusBadge(status: FleetVehicleStatus): { color: "success" | "warning" | "danger" | "informative"; label: string } {
  switch (status) {
    case "in_transit": return { color: "success", label: "In Transit" };
    case "idle": return { color: "warning", label: "Idle" };
    case "maintenance": return { color: "danger", label: "Maintenance" };
    case "returning": return { color: "informative", label: "Returning" };
  }
}

export function FleetManagementPage() {
  const styles = useStyles();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTab, setViewTab] = useState<"map" | "cards">("map");
  const { showWeather, enableClustering } = useMapSettings();
  const [weatherData, setWeatherData] = useState<LocationWeather[]>([]);

  useEffect(() => {
    d365McpClient.initialize();
    d365McpClient.getFleetStatus().then((data) => {
      setVehicles(data);
      setIsLoading(false);
    });
  }, []);

  // Fetch weather data for vehicle locations when enabled
  useEffect(() => {
    if (!showWeather || vehicles.length === 0) {
      setWeatherData([]);
      return;
    }
    // Use unique-ish locations from the fleet (up to 5 to avoid clutter)
    const locations = vehicles.slice(0, 5).map((v) => v.currentLocation.coordinates);
    getWeatherForecast({ locations }).then(setWeatherData).catch(() => setWeatherData([]));
  }, [showWeather, vehicles]);

  const inTransit = vehicles.filter((v) => v.status === "in_transit").length;
  const idle = vehicles.filter((v) => v.status === "idle").length;
  const utilization = vehicles.length > 0 ? Math.round((inTransit / vehicles.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Fleet Management</Text>
          <Text size={200}>Real-time fleet tracking and vehicle status</Text>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading fleet data..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Fleet Management
        </Text>
        <Text size={200}>Real-time fleet tracking and vehicle status</Text>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <VehicleCar24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Total Fleet</Text>
            <CounterBadge count={vehicles.length} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconActive}`}>
            <TopSpeed24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>In Transit</Text>
            <CounterBadge count={inTransit} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconIdle}`}>
            <Clock24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Idle</Text>
            <CounterBadge count={idle} color="informative" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconMaint}`}>
            <GasPump24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Utilization</Text>
            <Text size={400} weight="semibold">{utilization}%</Text>
          </div>
        </Card>
      </div>

      <TabList selectedValue={viewTab} onTabSelect={(_, data) => setViewTab(data.value as "map" | "cards")}>
        <Tab icon={<Map24Regular />} value="map">Map View</Tab>
        <Tab icon={<Grid24Regular />} value="cards">Card View</Tab>
      </TabList>

      {viewTab === "map" && (
        <div className={styles.mapContainer}>
          <FleetMap vehicles={vehicles} enableClustering={enableClustering} weatherData={weatherData} />
        </div>
      )}

      {viewTab === "cards" && (
      <div className={styles.vehicleGrid}>
        {vehicles.map((vehicle) => {
          const badge = getStatusBadge(vehicle.status);
          return (
            <Card key={vehicle.id} className={styles.vehicleCard}>
              <div className={styles.vehicleCardContent}>
                <div className={styles.vehicleHeader}>
                  <div className={styles.vehicleId}>
                    <Text weight="semibold" size={400}>
                      {vehicle.vehicleId}
                    </Text>
                    <Text size={200}>{vehicle.licensePlate}</Text>
                  </div>
                  <Badge appearance="filled" color={badge.color} size="medium">
                    {badge.label}
                  </Badge>
                </div>

                <Text size={200}>
                  {vehicle.driverName} — {vehicle.currentLocation.label}
                </Text>

                {vehicle.assignedRoute && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Route: {vehicle.assignedRoute}
                    {vehicle.currentShipmentId && ` (${vehicle.currentShipmentId})`}
                  </Text>
                )}

                <div className={styles.metricRow}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}><TopSpeed24Regular /></span>
                    <Text size={200}>{vehicle.speedKmh} km/h</Text>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}><Clock24Regular /></span>
                    <Text size={200}>{vehicle.hoursOnDuty}h on duty</Text>
                  </div>
                </div>

                <div className={styles.progressRow}>
                  <Text size={100}>Load: {vehicle.loadPercent}%</Text>
                  <ProgressBar
                    value={vehicle.loadPercent / 100}
                    color={vehicle.loadPercent > 90 ? "error" : "brand"}
                    thickness="medium"
                  />
                </div>
                <div className={styles.progressRow}>
                  <Text size={100}>Fuel: {vehicle.fuelLevelPercent}%</Text>
                  <ProgressBar
                    value={vehicle.fuelLevelPercent / 100}
                    color={vehicle.fuelLevelPercent < 25 ? "error" : vehicle.fuelLevelPercent < 50 ? "warning" : "success"}
                    thickness="medium"
                  />
                </div>

                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Distance today: {vehicle.distanceTodayKm} km
                </Text>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
