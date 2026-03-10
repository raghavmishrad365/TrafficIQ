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
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  Box24Regular,
  Warning24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { InventoryItem, Warehouse } from "../types/supplychain";

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
  controls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
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
  statIconHealthy: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconAlert: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  inventoryList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  inventoryRow: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    display: "grid",
    gridTemplateColumns: "120px 1fr auto auto auto auto auto",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
      gap: tokens.spacingVerticalS,
    },
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

function getStockBadge(item: InventoryItem): { color: "success" | "warning" | "danger"; label: string } {
  if (!item.reorderPoint) return { color: "success", label: "Healthy" };
  if (item.quantityAvailable < item.reorderPoint) return { color: "danger", label: "Below Reorder" };
  if (item.quantityAvailable < item.reorderPoint * 1.5) return { color: "warning", label: "Low Stock" };
  return { color: "success", label: "Healthy" };
}

export function InventoryPage() {
  const styles = useStyles();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    d365McpClient.initialize();
    d365McpClient.getWarehouses().then((whs) => {
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWarehouse(whs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) return;
    setIsLoading(true);
    d365McpClient.getWarehouseInventory(selectedWarehouse).then((items) => {
      setInventory(items);
      setIsLoading(false);
    });
  }, [selectedWarehouse]);

  const totalSKUs = inventory.length;
  const belowReorder = inventory.filter(
    (i) => i.reorderPoint && i.quantityAvailable < i.reorderPoint
  ).length;
  const healthyCount = totalSKUs - belowReorder;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Inventory Management
        </Text>
        <Text size={200}>Monitor stock levels, reorder alerts, and warehouse inventory</Text>
      </div>

      <div className={styles.controls}>
        <Text weight="semibold">Warehouse:</Text>
        <Dropdown
          value={warehouses.find((w) => w.id === selectedWarehouse)?.name || ""}
          onOptionSelect={(_, data) => {
            const wh = warehouses.find((w) => w.name === data.optionText);
            if (wh) setSelectedWarehouse(wh.id);
          }}
        >
          {warehouses.map((wh) => (
            <Option key={wh.id} value={wh.id}>
              {wh.name}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <Box24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Total SKUs</Text>
            <CounterBadge count={totalSKUs} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconHealthy}`}>
            <Checkmark24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Healthy Stock</Text>
            <CounterBadge count={healthyCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconAlert}`}>
            <Warning24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Below Reorder</Text>
            <CounterBadge count={belowReorder} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Loading inventory..." />
        </div>
      ) : (
        <div className={styles.inventoryList}>
          {inventory.map((item) => {
            const badge = getStockBadge(item);
            return (
              <Card key={item.itemId} className={styles.inventoryRow}>
                <Text weight="semibold" size={300}>
                  {item.itemId}
                </Text>
                <Text size={200} truncate wrap={false}>
                  {item.itemName}
                </Text>
                <Badge appearance="filled" color={badge.color} size="medium">
                  {badge.label}
                </Badge>
                <div className={styles.detailCell}>
                  <Text size={100}>On Hand</Text>
                  <Text size={200} weight="semibold">
                    {item.quantityOnHand.toLocaleString()} {item.unit}
                  </Text>
                </div>
                <div className={styles.detailCell}>
                  <Text size={100}>Reserved</Text>
                  <Text size={200} weight="semibold">
                    {item.quantityReserved.toLocaleString()}
                  </Text>
                </div>
                <div className={styles.detailCell}>
                  <Text size={100}>Available</Text>
                  <Text size={200} weight="semibold">
                    {item.quantityAvailable.toLocaleString()}
                  </Text>
                </div>
                <div className={styles.detailCell}>
                  <Text size={100}>Reorder Pt</Text>
                  <Text size={200} weight="semibold">
                    {item.reorderPoint?.toLocaleString() ?? "—"}
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
