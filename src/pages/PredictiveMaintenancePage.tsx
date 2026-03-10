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
  Divider,
  ProgressBar,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  VehicleCar24Regular,
  Warning24Regular,
  Wrench24Regular,
  Heart24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { VehicleHealth, MaintenanceAlert, MaintenanceRecord } from "../types/supplychain";

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
  statIconHealthy: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconCritical: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  statIconAvg: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  vehicleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  vehicleCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  vehicleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  healthBar: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  metricsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  metricItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  alertsSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  alertCard: {
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  alertHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTable: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  historyRow: {
    display: "grid",
    gridTemplateColumns: "100px 1fr 120px 80px 120px",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    borderRadius: tokens.borderRadiusMedium,
    ":hover": { backgroundColor: tokens.colorNeutralBackground3 },
  },
  historyHeader: {
    fontWeight: tokens.fontWeightSemibold as unknown as number,
    color: tokens.colorNeutralForeground3,
  },
  badgeRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

function getHealthColor(score: number): "success" | "warning" | "danger" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function getSeverityColor(severity: string): "danger" | "warning" | "informative" | "success" {
  switch (severity) {
    case "critical": return "danger";
    case "high": return "warning";
    case "medium": return "informative";
    default: return "success";
  }
}

type TabValue = "fleet" | "alerts" | "history";

export function PredictiveMaintenancePage() {
  const styles = useStyles();
  const [vehicles, setVehicles] = useState<VehicleHealth[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("fleet");

  useEffect(() => {
    d365McpClient.initialize();
    Promise.all([
      d365McpClient.getVehicleHealth(),
      d365McpClient.getMaintenanceAlerts(),
      d365McpClient.getMaintenanceHistory(),
    ]).then(([v, a, h]) => {
      setVehicles(v);
      setAlerts(a);
      setHistory(h);
      setIsLoading(false);
    });
  }, []);

  const healthyCount = vehicles.filter((v) => v.healthScore >= 75).length;
  const warningCount = vehicles.filter((v) => v.healthScore >= 50 && v.healthScore < 75).length;
  const criticalCount = vehicles.filter((v) => v.healthScore < 50).length;
  const avgHealth = vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length) : 0;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Predictive Maintenance</Text>
          <Text size={200}>Fleet health monitoring with AI-predicted maintenance needs</Text>
        </div>
        <div className={styles.loadingContainer}><Spinner label="Loading fleet health data..." /></div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">Predictive Maintenance</Text>
        <Text size={200}>Fleet health monitoring with AI-predicted maintenance needs</Text>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconHealthy}`}><Heart24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Healthy</Text>
            <CounterBadge count={healthyCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconWarning}`}><Warning24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Warning</Text>
            <CounterBadge count={warningCount} color="informative" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconCritical}`}><VehicleCar24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Critical</Text>
            <CounterBadge count={criticalCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconAvg}`}><Wrench24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Avg Health Score</Text>
            <Text size={500} weight="semibold">{avgHealth}</Text>
          </div>
        </Card>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as TabValue)}>
        <Tab value="fleet">Fleet Health</Tab>
        <Tab value="alerts">Maintenance Alerts ({alerts.length})</Tab>
        <Tab value="history">Service History</Tab>
      </TabList>

      {tab === "fleet" && (
        <div className={styles.vehicleGrid}>
          {vehicles.map((v) => (
            <Card key={v.vehicleId} className={styles.vehicleCard}>
              <div className={styles.vehicleHeader}>
                <div className={styles.vehicleHeaderLeft}>
                  <VehicleCar24Regular />
                  <div>
                    <Text weight="semibold" size={300}>{v.vehicleId}</Text>
                    <Text size={100} style={{ display: "block", color: tokens.colorNeutralForeground3 }}>{v.licensePlate}</Text>
                  </div>
                </div>
                <Badge appearance="filled" color={getHealthColor(v.healthScore)} size="large">
                  {v.healthScore}/100
                </Badge>
              </div>

              <div className={styles.healthBar}>
                <Text size={100}>Health Score</Text>
                <ProgressBar
                  value={v.healthScore / 100}
                  color={getHealthColor(v.healthScore) === "danger" ? "error" : getHealthColor(v.healthScore) === "warning" ? "warning" : "success"}
                  thickness="large"
                />
              </div>

              <div className={styles.metricsRow}>
                <div className={styles.metricItem}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Mileage</Text>
                  <Text size={200} weight="semibold">{v.mileageKm.toLocaleString()} km</Text>
                </div>
                <div className={styles.metricItem}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Engine Hours</Text>
                  <Text size={200} weight="semibold">{v.engineHours.toLocaleString()}h</Text>
                </div>
                <div className={styles.metricItem}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Next Service</Text>
                  <Text size={200} weight="semibold">{v.nextPredictedService}</Text>
                </div>
              </div>

              {v.alerts.length > 0 && (
                <>
                  <Divider />
                  <div className={styles.badgeRow}>
                    {v.alerts.map((a) => (
                      <Badge key={a.id} appearance="filled" color={getSeverityColor(a.severity)} size="small">
                        {a.component}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "alerts" && (
        <div className={styles.alertsSection}>
          {alerts.map((a) => (
            <Card key={a.id} className={styles.alertCard}>
              <div className={styles.alertHeader}>
                <div className={styles.badgeRow}>
                  <Badge appearance="filled" color={getSeverityColor(a.severity)} size="medium">
                    {a.severity}
                  </Badge>
                  <Text weight="semibold" size={300}>{a.vehicleId} — {a.component}</Text>
                </div>
                <Text size={200}>Confidence: {a.confidencePercent}%</Text>
              </div>
              <Text size={200}>{a.recommendedAction}</Text>
              <div className={styles.badgeRow}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Predicted failure: {a.predictedFailureDate}
                </Text>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Est. cost: {a.estimatedCost.toLocaleString()} DKK
                </Text>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className={styles.historyTable}>
          <div className={`${styles.historyRow} ${styles.historyHeader}`}>
            <Text size={100}>Vehicle</Text>
            <Text size={100}>Service Type</Text>
            <Text size={100}>Date</Text>
            <Text size={100}>Cost</Text>
            <Text size={100}>Technician</Text>
          </div>
          <Divider />
          {history.map((r) => (
            <div key={r.id} className={styles.historyRow}>
              <Text size={200} weight="semibold">{r.vehicleId}</Text>
              <Text size={200}>{r.serviceType}</Text>
              <Text size={200}>{r.date}</Text>
              <Text size={200}>{r.cost.toLocaleString()} DKK</Text>
              <Text size={200}>{r.technician}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
