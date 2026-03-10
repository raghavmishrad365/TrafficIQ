import { useState, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  Badge,
  Spinner,
  Divider,
} from "@fluentui/react-components";
import {
  DataTrending24Regular,
  VehicleTruckProfile24Regular,
  Clock24Regular,
  Warning24Regular,
  Checkmark24Regular,
  ArrowUp20Regular,
  ArrowDown20Regular,
  Box24Regular,
  Wrench24Regular,
  Money24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../config/routes";
import type { SupplyChainKPIs, ExceptionAlert } from "../types/supplychain";

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
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  kpiCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    cursor: "pointer",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  kpiHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconBrand: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  kpiIconGreen: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  kpiIconRed: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  kpiIconBlue: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  kpiIconYellow: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  kpiValue: {
    display: "flex",
    alignItems: "baseline",
    gap: tokens.spacingHorizontalXS,
  },
  trendUp: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: tokens.colorPaletteGreenForeground1,
  },
  trendDown: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: tokens.colorPaletteRedForeground1,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  alertCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "flex-start",
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    cursor: "pointer",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  alertIcon: {
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertIconCritical: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  alertIconHigh: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  alertIconMedium: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  alertContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

// Map KPI labels to their relevant pages
const KPI_ROUTES: Record<string, string> = {
  "On-Time Delivery": ROUTES.SHIPMENTS,
  "Active Shipments": ROUTES.SHIPMENTS,
  "Delayed Shipments": ROUTES.SHIPMENTS,
  "Avg Delivery Time": ROUTES.SHIPMENTS,
  "Cost Per Km": ROUTES.ANALYTICS,
  "SLA Compliance": ROUTES.SHIPMENTS,
  "Warehouse Utilization": ROUTES.INVENTORY,
  "Fleet Utilization": ROUTES.FLEET,
  "Deliveries Today": ROUTES.SHIPMENTS,
  "Pending Work Orders": ROUTES.WORK_ORDERS,
};

// Map alert types to their relevant pages
function getAlertRoute(alert: ExceptionAlert): string {
  switch (alert.type) {
    case "delay": return ROUTES.TRACKING;
    case "maintenance": return ROUTES.MAINTENANCE;
    case "stock": return ROUTES.INVENTORY;
    case "sla": return ROUTES.SHIPMENTS;
    case "weather": return ROUTES.DASHBOARD;
    default: return ROUTES.ANALYTICS;
  }
}

export function AnalyticsPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [kpis, setKPIs] = useState<SupplyChainKPIs | null>(null);
  const [alerts, setAlerts] = useState<ExceptionAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    d365McpClient.initialize();
    Promise.all([
      d365McpClient.getSupplyChainKPIs(),
      d365McpClient.getExceptionAlerts(),
    ]).then(([kpiData, alertData]) => {
      setKPIs(kpiData);
      setAlerts(alertData);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !kpis) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Analytics &amp; Control Tower</Text>
          <Text size={200}>Executive supply chain KPI dashboard</Text>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading analytics..." />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "On-Time Delivery",
      value: `${kpis.onTimeDeliveryRate}%`,
      icon: <Checkmark24Regular />,
      iconClass: styles.kpiIconGreen,
      trend: "+2.3%",
      trendDir: "up" as const,
    },
    {
      label: "Active Shipments",
      value: String(kpis.activeShipments),
      icon: <VehicleTruckProfile24Regular />,
      iconClass: styles.kpiIconBrand,
      trend: null,
      trendDir: null,
    },
    {
      label: "Delayed Shipments",
      value: String(kpis.delayedShipments),
      icon: <Warning24Regular />,
      iconClass: styles.kpiIconRed,
      trend: "-1",
      trendDir: "up" as const,
    },
    {
      label: "Avg Delivery Time",
      value: `${kpis.avgDeliveryTimeMinutes} min`,
      icon: <Clock24Regular />,
      iconClass: styles.kpiIconBlue,
      trend: "-8 min",
      trendDir: "up" as const,
    },
    {
      label: "Cost Per Km",
      value: `${kpis.costPerKm} DKK`,
      icon: <Money24Regular />,
      iconClass: styles.kpiIconYellow,
      trend: "-0.15",
      trendDir: "up" as const,
    },
    {
      label: "SLA Compliance",
      value: `${kpis.slaComplianceRate}%`,
      icon: <DataTrending24Regular />,
      iconClass: styles.kpiIconGreen,
      trend: "+1.1%",
      trendDir: "up" as const,
    },
    {
      label: "Warehouse Utilization",
      value: `${kpis.warehouseUtilization}%`,
      icon: <Box24Regular />,
      iconClass: styles.kpiIconBrand,
      trend: "+3.2%",
      trendDir: "up" as const,
    },
    {
      label: "Fleet Utilization",
      value: `${kpis.fleetUtilization}%`,
      icon: <VehicleTruckProfile24Regular />,
      iconClass: styles.kpiIconBlue,
      trend: "-5.1%",
      trendDir: "down" as const,
    },
    {
      label: "Deliveries Today",
      value: String(kpis.totalDeliveriesToday),
      icon: <Checkmark24Regular />,
      iconClass: styles.kpiIconGreen,
      trend: null,
      trendDir: null,
    },
    {
      label: "Pending Work Orders",
      value: String(kpis.pendingWorkOrders),
      icon: <Wrench24Regular />,
      iconClass: styles.kpiIconYellow,
      trend: "+2",
      trendDir: "down" as const,
    },
  ];

  function getAlertIconClass(severity: ExceptionAlert["severity"]) {
    switch (severity) {
      case "critical": return styles.alertIconCritical;
      case "high": return styles.alertIconHigh;
      default: return styles.alertIconMedium;
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Analytics &amp; Control Tower
        </Text>
        <Text size={200}>Executive supply chain KPI dashboard</Text>
      </div>

      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className={styles.kpiCard} onClick={() => navigate(KPI_ROUTES[kpi.label] ?? ROUTES.ANALYTICS)}>
            <div className={styles.kpiHeader}>
              <Text size={200}>{kpi.label}</Text>
              <div className={`${styles.kpiIconBox} ${kpi.iconClass}`}>
                {kpi.icon}
              </div>
            </div>
            <div className={styles.kpiValue}>
              <Text size={600} weight="semibold">
                {kpi.value}
              </Text>
              {kpi.trend && (
                <span className={kpi.trendDir === "up" ? styles.trendUp : styles.trendDown}>
                  {kpi.trendDir === "up" ? <ArrowUp20Regular /> : <ArrowDown20Regular />}
                  <Text size={200}>{kpi.trend}</Text>
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Divider />

      <div className={styles.sectionTitle}>
        <Warning24Regular />
        <Text size={500} weight="semibold">
          Exception Alerts
        </Text>
        <Badge appearance="filled" color="danger" size="small">
          {alerts.length}
        </Badge>
      </div>

      <div className={styles.alertList}>
        {alerts.map((alert) => (
          <Card key={alert.id} className={styles.alertCard} onClick={() => navigate(getAlertRoute(alert), alert.relatedEntityId ? { state: { shipmentId: alert.relatedEntityId } } : undefined)}>
            <div className={`${styles.alertIcon} ${getAlertIconClass(alert.severity)}`}>
              <Warning24Regular />
            </div>
            <div className={styles.alertContent}>
              <div style={{ display: "flex", gap: tokens.spacingHorizontalS, alignItems: "center" }}>
                <Text weight="semibold" size={300}>
                  {alert.title}
                </Text>
                <Badge
                  appearance="outline"
                  color={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "warning" : "informative"}
                  size="small"
                >
                  {alert.severity}
                </Badge>
                <Badge appearance="tint" size="small">
                  {alert.type}
                </Badge>
              </div>
              <Text size={200}>{alert.description}</Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                {new Date(alert.timestamp).toLocaleString()}
              </Text>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
