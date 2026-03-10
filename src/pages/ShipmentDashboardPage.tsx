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
} from "@fluentui/react-components";
import {
  VehicleTruckProfile24Regular,
  Clock24Regular,
  Warning24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { d365McpClient } from "../services/d365McpClient";
import { ROUTES } from "../config/routes";
import type { Shipment, ShipmentStatus } from "../types/supplychain";

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
    ":hover": {
      boxShadow: tokens.shadow4,
    },
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
  statIconTransit: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  statIconDelayed: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  statIconDelivered: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  shipmentList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  shipmentRow: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    display: "grid",
    gridTemplateColumns: "140px 1fr auto auto auto auto",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    cursor: "pointer",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
      gap: tokens.spacingVerticalS,
    },
  },
  routeLabel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  badgeGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  detailCell: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    alignItems: "flex-end",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

function getStatusBadgeColor(status: ShipmentStatus): "brand" | "warning" | "danger" | "success" | "informative" {
  switch (status) {
    case "in_transit":
      return "brand";
    case "packed":
      return "warning";
    case "delayed":
      return "danger";
    case "delivered":
      return "success";
    case "pending":
    default:
      return "informative";
  }
}

function getStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case "in_transit":
      return "In Transit";
    case "packed":
      return "Packed";
    case "delayed":
      return "Delayed";
    case "delivered":
      return "Delivered";
    case "pending":
      return "Pending";
    case "picked":
      return "Picked";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getPriorityBadgeColor(priority: Shipment["priority"]): "danger" | "warning" | "informative" {
  switch (priority) {
    case "urgent":
      return "danger";
    case "express":
      return "warning";
    case "standard":
    default:
      return "informative";
  }
}

export function ShipmentDashboardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      d365McpClient.initialize();
      const data = await d365McpClient.getWarehouseShipments();
      if (!cancelled) {
        setShipments(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCount = shipments.length;
  const inTransitCount = shipments.filter((s) => s.status === "in_transit").length;
  const delayedCount = shipments.filter((s) => s.status === "delayed").length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">
            Shipment Dashboard
          </Text>
          <Text size={200}>Track active deliveries and logistics</Text>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading shipments..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Shipment Dashboard
        </Text>
        <Text size={200}>Track active deliveries and logistics</Text>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <VehicleTruckProfile24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Total Shipments</Text>
            <CounterBadge count={totalCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTransit}`}>
            <Clock24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>In Transit</Text>
            <CounterBadge count={inTransitCount} color="informative" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconDelayed}`}>
            <Warning24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Delayed</Text>
            <CounterBadge count={delayedCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconDelivered}`}>
            <Checkmark24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Delivered</Text>
            <CounterBadge count={deliveredCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
      </div>

      {/* Shipment List */}
      <div className={styles.shipmentList}>
        {shipments.map((shipment) => (
          <Card key={shipment.id} className={styles.shipmentRow} onClick={() => navigate(ROUTES.TRACKING, { state: { shipmentId: shipment.shipmentId } })}>
            <Text weight="semibold" size={300}>
              {shipment.shipmentId}
            </Text>
            <div className={styles.routeLabel}>
              <Text size={200} truncate wrap={false}>
                {shipment.origin.label}
              </Text>
              <Text size={200} truncate wrap={false}>
                &rarr; {shipment.destination.label}
              </Text>
            </div>
            <div className={styles.badgeGroup}>
              <Badge
                appearance="filled"
                color={getStatusBadgeColor(shipment.status)}
                size="medium"
              >
                {getStatusLabel(shipment.status)}
              </Badge>
            </div>
            <Badge
              appearance="outline"
              color={getPriorityBadgeColor(shipment.priority)}
              size="medium"
            >
              {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
            </Badge>
            <div className={styles.detailCell}>
              <Text size={100}>ETA</Text>
              <Text size={200} weight="semibold">
                {shipment.estimatedArrival
                  ? new Date(shipment.estimatedArrival).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </Text>
            </div>
            <div className={styles.detailCell}>
              <Text size={100}>Delay</Text>
              <Text
                size={200}
                weight="semibold"
              >
                {shipment.currentTrafficDelay != null
                  ? `${shipment.currentTrafficDelay} min`
                  : "None"}
              </Text>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
