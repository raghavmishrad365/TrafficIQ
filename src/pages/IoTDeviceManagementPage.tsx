import { useState, useEffect, useCallback } from "react";
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
  Switch,
  Dropdown,
  Option,
  Tooltip,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@fluentui/react-components";
import {
  Wifi124Regular,
  WifiOff24Regular,
  Warning24Regular,
  Battery024Regular,
  Router24Regular,
} from "@fluentui/react-icons";
import { iotHubClient } from "../services/iotHubClient";
import type { IoTDevice } from "../services/iotHubClient";
import { d365McpClient } from "../services/d365McpClient";
import type { FleetVehicle } from "../types/supplychain";

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
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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
  statIconOnline: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconOffline: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  statIconDegraded: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconBattery: {
    backgroundColor: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  tableWrapper: {
    overflowX: "auto",
  },
  progressCell: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    minWidth: "100px",
  },
  dropdownCell: {
    minWidth: "140px",
  },
});

type StatusFilter = "all" | "online" | "offline" | "degraded";

function getStatusBadge(status: IoTDevice["status"]): { color: "success" | "danger" | "warning"; label: string } {
  switch (status) {
    case "online": return { color: "success", label: "Online" };
    case "offline": return { color: "danger", label: "Offline" };
    case "degraded": return { color: "warning", label: "Degraded" };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function IoTDeviceManagementPage() {
  const styles = useStyles();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    iotHubClient.initialize();
    d365McpClient.initialize();
    Promise.all([
      iotHubClient.getDevices(),
      d365McpClient.getFleetStatus(),
    ]).then(([deviceData, vehicleData]) => {
      setDevices(deviceData);
      setVehicles(vehicleData);
      setIsLoading(false);
    });
  }, []);

  const handleToggleActive = useCallback(async (deviceId: string, active: boolean) => {
    const updated = await iotHubClient.updateDeviceStatus(deviceId, active);
    if (updated) {
      setDevices(prev => prev.map(d => d.deviceId === deviceId ? updated : d));
    }
  }, []);

  const handleAssignVehicle = useCallback(async (deviceId: string, vehicleId: string) => {
    const vehicle = vehicles.find(v => v.vehicleId === vehicleId);
    if (!vehicle) return;
    const updated = await iotHubClient.assignDeviceToVehicle(deviceId, vehicleId, vehicle.licensePlate);
    if (updated) {
      setDevices(prev => prev.map(d => d.deviceId === deviceId ? updated : d));
    }
  }, [vehicles]);

  const filteredDevices = statusFilter === "all"
    ? devices
    : devices.filter(d => d.status === statusFilter);

  const onlineCount = devices.filter(d => d.status === "online").length;
  const offlineCount = devices.filter(d => d.status === "offline").length;
  const degradedCount = devices.filter(d => d.status === "degraded").length;
  const lowBatteryCount = devices.filter(d => d.batteryLevelPercent < 30).length;

  // Build a vehicle-to-shipment lookup
  const vehicleShipmentMap = new Map<string, string>();
  vehicles.forEach(v => {
    if (v.currentShipmentId) vehicleShipmentMap.set(v.vehicleId, v.currentShipmentId);
  });

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">IoT Device Management</Text>
          <Text size={200}>Manage GPS trackers, device health, and vehicle assignments</Text>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading IoT devices..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">IoT Device Management</Text>
        <Text size={200}>Manage GPS trackers, device health, and vehicle assignments</Text>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <Router24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Total Devices</Text>
            <CounterBadge count={devices.length} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconOnline}`}>
            <Wifi124Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Online</Text>
            <CounterBadge count={onlineCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconOffline}`}>
            <WifiOff24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Offline</Text>
            <CounterBadge count={offlineCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconDegraded}`}>
            <Warning24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Degraded</Text>
            <CounterBadge count={degradedCount} color="important" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBattery}`}>
            <Battery024Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Low Battery</Text>
            <CounterBadge count={lowBatteryCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <TabList
        selectedValue={statusFilter}
        onTabSelect={(_, data) => setStatusFilter(data.value as StatusFilter)}
      >
        <Tab value="all">All Devices ({devices.length})</Tab>
        <Tab value="online">Online ({onlineCount})</Tab>
        <Tab value="offline">Offline ({offlineCount})</Tab>
        <Tab value="degraded">Degraded ({degradedCount})</Tab>
      </TabList>

      {/* Device Table */}
      <div className={styles.tableWrapper}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Device ID</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
              <TableHeaderCell>Assigned Vehicle</TableHeaderCell>
              <TableHeaderCell>Shipment</TableHeaderCell>
              <TableHeaderCell>Device Model</TableHeaderCell>
              <TableHeaderCell>Signal</TableHeaderCell>
              <TableHeaderCell>Battery</TableHeaderCell>
              <TableHeaderCell>Last Heartbeat</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Installed</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map(device => {
              const badge = getStatusBadge(device.status);
              const shipmentId = vehicleShipmentMap.get(device.vehicleId);
              return (
                <TableRow key={device.deviceId}>
                  <TableCell>
                    <Text weight="semibold">{device.deviceId}</Text>
                  </TableCell>
                  <TableCell>
                    <Badge appearance="filled" color={badge.color} size="medium">
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={device.status !== "offline"}
                      onChange={(_, data) => handleToggleActive(device.deviceId, data.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className={styles.dropdownCell}>
                      <Dropdown
                        value={device.vehicleId}
                        selectedOptions={[device.vehicleId]}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) handleAssignVehicle(device.deviceId, data.optionValue);
                        }}
                        size="small"
                        appearance="underline"
                      >
                        {vehicles.map(v => (
                          <Option key={v.vehicleId} value={v.vehicleId} text={`${v.vehicleId} (${v.licensePlate})`}>
                            {v.vehicleId} ({v.licensePlate})
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{shipmentId ?? "—"}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{device.deviceModel}</Text>
                  </TableCell>
                  <TableCell>
                    <div className={styles.progressCell}>
                      <ProgressBar
                        value={device.signalStrengthPercent / 100}
                        color={device.signalStrengthPercent > 60 ? "brand" : device.signalStrengthPercent > 30 ? "warning" : "error"}
                        thickness="medium"
                        style={{ flex: 1 }}
                      />
                      <Text size={100}>{device.signalStrengthPercent}%</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.progressCell}>
                      <ProgressBar
                        value={device.batteryLevelPercent / 100}
                        color={device.batteryLevelPercent > 50 ? "success" : device.batteryLevelPercent > 25 ? "warning" : "error"}
                        thickness="medium"
                        style={{ flex: 1 }}
                      />
                      <Text size={100}>{device.batteryLevelPercent}%</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={new Date(device.lastHeartbeat).toLocaleString()} relationship="label">
                      <Text size={200}>{relativeTime(device.lastHeartbeat)}</Text>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{device.lastKnownLocation.label}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{device.installedDate}</Text>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
