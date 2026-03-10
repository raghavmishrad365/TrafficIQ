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
  TabList,
  Tab,
  Divider,
} from "@fluentui/react-components";
import {
  ArrowUndo24Regular,
  VehicleTruckProfile24Regular,
  Checkmark24Regular,
  Clock24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { ReturnOrder, ReturnStatus } from "../types/supplychain";

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
  statIconOpen: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconTransit: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  statIconDone: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconRefund: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  returnsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  returnCard: {
    borderRadius: tokens.borderRadiusXLarge,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  returnContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  returnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  returnHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  badgeRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  returnMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
  },
  itemsList: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

function getStatusBadge(status: ReturnStatus): { color: "warning" | "brand" | "informative" | "success" | "danger"; label: string } {
  switch (status) {
    case "requested": return { color: "warning", label: "Requested" };
    case "approved": return { color: "informative", label: "Approved" };
    case "pickup_scheduled": return { color: "brand", label: "Pickup Scheduled" };
    case "in_transit": return { color: "brand", label: "In Transit" };
    case "received": return { color: "informative", label: "Received" };
    case "processed": return { color: "success", label: "Processed" };
    case "rejected": return { color: "danger", label: "Rejected" };
  }
}

function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    damaged: "Damaged",
    wrong_item: "Wrong Item",
    quality_issue: "Quality Issue",
    changed_mind: "Changed Mind",
    defective: "Defective",
    other: "Other",
  };
  return labels[reason] || reason;
}

type ReturnFilter = "all" | ReturnStatus;

export function ReturnsPage() {
  const styles = useStyles();
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReturnFilter>("all");

  useEffect(() => {
    d365McpClient.initialize();
    d365McpClient.getReturns().then((r) => {
      setReturns(r);
      setIsLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? returns : returns.filter((r) => r.status === filter);
  const openCount = returns.filter((r) => ["requested", "approved", "pickup_scheduled"].includes(r.status)).length;
  const transitCount = returns.filter((r) => r.status === "in_transit").length;
  const processedCount = returns.filter((r) => r.status === "processed").length;
  const totalRefund = returns.reduce((s, r) => s + r.refundAmount, 0);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Returns & Reverse Logistics</Text>
          <Text size={200}>Return authorization and reverse logistics management</Text>
        </div>
        <div className={styles.loadingContainer}><Spinner label="Loading returns..." /></div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">Returns & Reverse Logistics</Text>
        <Text size={200}>Return authorization and reverse logistics management</Text>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconOpen}`}><ArrowUndo24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Open Returns</Text>
            <CounterBadge count={openCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTransit}`}><VehicleTruckProfile24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>In Transit</Text>
            <CounterBadge count={transitCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconDone}`}><Checkmark24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Processed</Text>
            <CounterBadge count={processedCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconRefund}`}><Clock24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Total Refunds</Text>
            <Text size={500} weight="semibold">{totalRefund.toLocaleString()} DKK</Text>
          </div>
        </Card>
      </div>

      <TabList selectedValue={filter} onTabSelect={(_, data) => setFilter(data.value as ReturnFilter)}>
        <Tab value="all">All ({returns.length})</Tab>
        <Tab value="requested">Requested</Tab>
        <Tab value="approved">Approved</Tab>
        <Tab value="pickup_scheduled">Pickup Scheduled</Tab>
        <Tab value="in_transit">In Transit</Tab>
        <Tab value="processed">Processed</Tab>
        <Tab value="rejected">Rejected</Tab>
      </TabList>

      <div className={styles.returnsList}>
        {filtered.map((ret) => {
          const statusBadge = getStatusBadge(ret.status);
          return (
            <Card key={ret.id} className={styles.returnCard}>
              <div className={styles.returnContent}>
                <div className={styles.returnHeader}>
                  <div className={styles.returnHeaderLeft}>
                    <Text weight="semibold" size={400}>{ret.returnId}</Text>
                    <Text size={200}>{ret.customerName}</Text>
                  </div>
                  <div className={styles.badgeRow}>
                    <Badge appearance="filled" color={statusBadge.color} size="medium">
                      {statusBadge.label}
                    </Badge>
                    <Badge appearance="outline" color="informative" size="medium">
                      {getReasonLabel(ret.reason)}
                    </Badge>
                  </div>
                </div>

                <Text size={200}>{ret.notes}</Text>

                <div className={styles.itemsList}>
                  {ret.items.map((item) => (
                    <Badge key={item.itemId} appearance="tint" size="small">
                      {item.itemName} x{item.quantity} ({item.condition})
                    </Badge>
                  ))}
                </div>

                <Divider />

                <div className={styles.returnMeta}>
                  <div className={styles.metaItem}>
                    <ArrowUndo24Regular />
                    <Text size={200}>Orig: {ret.originalShipmentId}</Text>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock24Regular />
                    <Text size={200}>Requested: {ret.requestedDate}</Text>
                  </div>
                  {ret.pickupDate && (
                    <div className={styles.metaItem}>
                      <VehicleTruckProfile24Regular />
                      <Text size={200}>Pickup: {ret.pickupDate}</Text>
                    </div>
                  )}
                  <div className={styles.metaItem}>
                    <Text size={200} weight="semibold">Refund: {ret.refundAmount.toLocaleString()} DKK</Text>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
