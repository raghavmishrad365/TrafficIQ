import { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  Button,
  Badge,
  Checkbox,
  Label,
  Spinner,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { VehicleTruckProfile24Regular } from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { Shipment, Warehouse } from "../types/supplychain";
import { DeliveryRouteMap } from "../components/map/DeliveryRouteMap";
import type { DeliveryMapStop } from "../components/map/DeliveryRouteMap";
import { ShareMenu } from "../components/common/ShareMenu";
import { useMapSettings } from "../context/MapSettingsContext";
import type { LocationWeather, PointOfInterest } from "../types/map";
import { getWeatherForecast, searchPOI } from "../services/azureMapsService";

interface RouteResult {
  stops: DeliveryMapStop[];
  routeCoordinates: [number, number][];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  trafficDelayMinutes: number;
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
    position: "relative" as const,
  },
  sectionCard: {
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
  shipmentCheckbox: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  shipmentCheckboxItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
  },
  shipmentCheckboxLabel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    flex: 1,
    minWidth: 0,
  },
  gradientButton: {
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed})`,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      background: `linear-gradient(135deg, ${tokens.colorBrandBackgroundHover}, ${tokens.colorBrandBackground})`,
    },
  },
  routeSummary: {
    borderRadius: tokens.borderRadiusXLarge,
    borderLeft: "3px solid " + tokens.colorBrandBackground,
  },
  routeSummaryContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  routeSummaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: tokens.spacingHorizontalM,
  },
  routeStat: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    alignItems: "center",
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
  },
  stopsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  stopItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
  },
  stopOrder: {
    width: "24px",
    height: "24px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "12px",
    fontWeight: 600,
  },
  stopDetails: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    flex: 1,
    minWidth: 0,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  emptyMessage: {
    ...shorthands.padding(tokens.spacingVerticalM),
    textAlign: "center" as const,
    color: tokens.colorNeutralForeground3,
  },
});

export function DeliveryPlannerPage() {
  const styles = useStyles();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set());
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { showWeather, showPOIs } = useMapSettings();
  const [weatherData, setWeatherData] = useState<LocationWeather[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);

  // Load warehouses on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      d365McpClient.initialize();
      const data = await d365McpClient.getWarehouses();
      if (!cancelled) {
        setWarehouses(data);
        setIsLoadingWarehouses(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load shipments when warehouse changes
  useEffect(() => {
    if (!selectedWarehouseId) {
      setShipments([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setIsLoadingShipments(true);
      setSelectedShipmentIds(new Set());
      setRouteResult(null);
      const data = await d365McpClient.getWarehouseShipments(selectedWarehouseId);
      if (!cancelled) {
        // Show only shipments that are pending, packed, or picked (eligible for delivery planning)
        const eligible = data.filter(
          (s) => s.status === "pending" || s.status === "packed" || s.status === "picked"
        );
        setShipments(eligible);
        setIsLoadingShipments(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedWarehouseId]);

  // Fetch weather overlay when enabled — use warehouse location or default Danish cities
  useEffect(() => {
    if (!showWeather) { setWeatherData([]); return; }
    const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);
    const locations = warehouse
      ? [warehouse.location.coordinates, { lat: 55.68, lng: 12.57 }, { lat: 56.16, lng: 10.20 }]
      : [{ lat: 55.68, lng: 12.57 }, { lat: 56.16, lng: 10.20 }, { lat: 55.40, lng: 10.39 }];
    getWeatherForecast({ locations }).then(setWeatherData).catch(() => setWeatherData([]));
  }, [showWeather, selectedWarehouseId, warehouses]);

  // Fetch POI data when enabled
  useEffect(() => {
    if (!showPOIs) { setPois([]); return; }
    const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);
    const center = warehouse?.location.coordinates ?? { lat: 55.68, lng: 12.57 };
    searchPOI({ center, radiusMeters: 50000, limit: 10 })
      .then(setPois).catch(() => setPois([]));
  }, [showPOIs, selectedWarehouseId, warehouses]);

  const handleShipmentToggle = useCallback((shipmentId: string, checked: boolean) => {
    setSelectedShipmentIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(shipmentId);
      } else {
        next.delete(shipmentId);
      }
      return next;
    });
    setRouteResult(null);
  }, []);

  const handleOptimize = useCallback(async () => {
    if (selectedShipmentIds.size === 0) return;

    setIsOptimizing(true);

    try {
      const selected = shipments.filter((s) => selectedShipmentIds.has(s.id));
      const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);
      if (!warehouse) return;

      const key = import.meta.env.VITE_AZURE_MAPS_KEY;
      const origin = warehouse.location.coordinates;

      // Build multi-stop query: origin:dest1:dest2:...
      const waypoints = selected.map(
        (s) =>
          `${s.destination.coordinates.lat},${s.destination.coordinates.lng}`
      );
      const query = `${origin.lat},${origin.lng}:${waypoints.join(":")}`;

      const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${query}&travelMode=car&traffic=true&routeType=fastest&computeBestOrder=true&instructionsType=text`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Route request failed: ${res.statusText}`);
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) throw new Error("No route found");

      // Get optimized waypoint order
      const optimizedOrder: number[] =
        route.optimizedWaypoints?.map(
          (wp: { providedIndex: number; optimizedIndex: number }) =>
            wp.providedIndex
        ) || selected.map((_: Shipment, i: number) => i);

      // Extract road-following coordinates from all legs
      const routeCoordinates: [number, number][] = [];
      for (const leg of route.legs || []) {
        for (const point of leg.points || []) {
          routeCoordinates.push([point.longitude, point.latitude]);
        }
      }

      // Build ordered stops based on optimized order
      const stops: DeliveryMapStop[] = optimizedOrder.map(
        (originalIdx: number, order: number) => {
          const shipment = selected[originalIdx] || selected[order];
          return {
            shipmentId: shipment.shipmentId,
            customerName: shipment.customerName,
            destination: shipment.destination.label || "Unknown",
            location: shipment.destination,
            order: order + 1,
          };
        }
      );

      const totalDistanceKm =
        Math.round((route.summary.lengthInMeters / 1000) * 10) / 10;
      const totalDurationMinutes = Math.round(
        route.summary.travelTimeInSeconds / 60
      );
      const trafficDelayMinutes = Math.round(
        route.summary.trafficDelayInSeconds / 60
      );

      setRouteResult({
        stops,
        routeCoordinates,
        totalDistanceKm,
        totalDurationMinutes: totalDurationMinutes + trafficDelayMinutes,
        trafficDelayMinutes,
      });
    } catch (error) {
      console.error("Azure Maps route optimization failed, using fallback:", error);

      // Fallback to straight-line calculation if API fails
      const selected = shipments.filter((s) => selectedShipmentIds.has(s.id));
      const stops: DeliveryMapStop[] = selected.map((s, index) => ({
        shipmentId: s.shipmentId,
        customerName: s.customerName,
        destination: s.destination.label || "Unknown",
        location: s.destination,
        order: index + 1,
      }));

      setRouteResult({
        stops,
        routeCoordinates: [],
        totalDistanceKm: selected.reduce(
          (sum, s) => sum + (s.routeDistanceKm ?? 0),
          0
        ),
        totalDurationMinutes: selected.reduce(
          (sum, s) => sum + (s.routeDurationMinutes ?? 0),
          0
        ),
        trafficDelayMinutes: selected.reduce(
          (sum, s) => sum + (s.currentTrafficDelay ?? 0),
          0
        ),
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedShipmentIds, shipments, warehouses, selectedWarehouseId]);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Delivery Route Planner
        </Text>
        <Text size={200}>Optimize multi-stop delivery routes</Text>
      </div>

      <div className={styles.content}>
        {/* Left Panel - Form */}
        <div className={styles.formPanel}>
          {/* Warehouse Selector */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardContent}>
              <Label weight="semibold">Select Warehouse</Label>
              {isLoadingWarehouses ? (
                <Spinner size="tiny" label="Loading warehouses..." />
              ) : (
                <Dropdown
                  placeholder="Choose a warehouse"
                  value={
                    warehouses.find((w) => w.id === selectedWarehouseId)?.name ?? ""
                  }
                  onOptionSelect={(_, data) => {
                    setSelectedWarehouseId(data.optionValue ?? "");
                  }}
                >
                  {warehouses.map((warehouse) => (
                    <Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Dropdown>
              )}
            </div>
          </Card>

          {/* Shipment Selection */}
          {selectedWarehouseId && (
            <Card className={styles.sectionCard}>
              <div className={styles.cardContent}>
                <Label weight="semibold">Select Shipments</Label>
                {isLoadingShipments ? (
                  <Spinner size="tiny" label="Loading shipments..." />
                ) : shipments.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    <Text size={200}>
                      No pending shipments for this warehouse.
                    </Text>
                  </div>
                ) : (
                  <div className={styles.shipmentCheckbox}>
                    {shipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className={styles.shipmentCheckboxItem}
                      >
                        <Checkbox
                          checked={selectedShipmentIds.has(shipment.id)}
                          onChange={(_, data) =>
                            handleShipmentToggle(
                              shipment.id,
                              data.checked === true
                            )
                          }
                        />
                        <div className={styles.shipmentCheckboxLabel}>
                          <Text size={200} weight="semibold">
                            {shipment.shipmentId} - {shipment.customerName}
                          </Text>
                          <Text size={100} truncate wrap={false}>
                            {shipment.destination.label}
                          </Text>
                        </div>
                        <Badge
                          appearance="outline"
                          color={
                            shipment.priority === "urgent"
                              ? "danger"
                              : shipment.priority === "express"
                                ? "warning"
                                : "informative"
                          }
                          size="small"
                        >
                          {shipment.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Optimize Button */}
          {selectedShipmentIds.size > 0 && (
            <Button
              appearance="primary"
              className={styles.gradientButton}
              icon={<VehicleTruckProfile24Regular />}
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? "Optimizing..." : "Optimize Route"}
            </Button>
          )}
        </div>

        {/* Right Panel - Map */}
        <div className={styles.mapPanel}>
          <DeliveryRouteMap
            warehouseLocation={
              warehouses.find((w) => w.id === selectedWarehouseId)?.location
            }
            stops={routeResult?.stops}
            routeCoordinates={routeResult?.routeCoordinates}
            weatherData={weatherData}
            pois={pois}
          />
        </div>
      </div>

      {/* Route Summary - shown after optimization */}
      {routeResult && (
        <Card className={styles.routeSummary}>
          <div className={styles.routeSummaryContent}>
            <div className={styles.routeSummaryHeader}>
              <Text size={400} weight="semibold">
                Optimized Route Summary
              </Text>
              <ShareMenu
                route={{
                  origin: {
                    lat: warehouses.find((w) => w.id === selectedWarehouseId)
                      ?.location.coordinates.lat ?? 0,
                    lng: warehouses.find((w) => w.id === selectedWarehouseId)
                      ?.location.coordinates.lng ?? 0,
                    label: warehouses.find((w) => w.id === selectedWarehouseId)
                      ?.name ?? "Warehouse",
                  },
                  destination: {
                    lat: routeResult.stops[routeResult.stops.length - 1]
                      ?.location.coordinates.lat ?? 0,
                    lng: routeResult.stops[routeResult.stops.length - 1]
                      ?.location.coordinates.lng ?? 0,
                    label: routeResult.stops[routeResult.stops.length - 1]
                      ?.destination ?? "Destination",
                  },
                  waypoints: routeResult.stops.slice(0, -1).map((s) => ({
                    lat: s.location.coordinates.lat,
                    lng: s.location.coordinates.lng,
                    label: s.destination,
                  })),
                }}
                size="small"
                appearance="secondary"
              />
            </div>

            {/* Stats */}
            <div className={styles.routeStatsGrid}>
              <div className={styles.routeStat}>
                <Text size={100}>Total Distance</Text>
                <Text size={400} weight="semibold">
                  {routeResult.totalDistanceKm} km
                </Text>
              </div>
              <div className={styles.routeStat}>
                <Text size={100}>Est. Duration</Text>
                <Text size={400} weight="semibold">
                  {routeResult.totalDurationMinutes} min
                </Text>
              </div>
              <div className={styles.routeStat}>
                <Text size={100}>Traffic Delay</Text>
                <Text size={400} weight="semibold">
                  {routeResult.trafficDelayMinutes} min
                </Text>
              </div>
            </div>

            {/* Ordered Stops */}
            <Label weight="semibold">Delivery Order</Label>
            <div className={styles.stopsList}>
              {routeResult.stops.map((stop, index) => (
                <div key={stop.shipmentId} className={styles.stopItem}>
                  <div className={styles.stopOrder}>{index + 1}</div>
                  <div className={styles.stopDetails}>
                    <Text size={200} weight="semibold">
                      {stop.customerName}
                    </Text>
                    <Text size={100} truncate wrap={false}>
                      {stop.shipmentId} &middot; {stop.destination}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
