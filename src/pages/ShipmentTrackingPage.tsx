import { useState, useEffect, useRef } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  Badge,
  Spinner,
  Input,
  Button,
  Divider,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Location24Regular,
  Checkmark24Regular,
  Box24Regular,
  VehicleTruckProfile24Regular,
  DocumentCheckmark24Regular,
  Map24Regular,
} from "@fluentui/react-icons";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import { useLocation } from "react-router-dom";
import { d365McpClient } from "../services/d365McpClient";
import type { Shipment, ShipmentTracking } from "../types/supplychain";

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
  searchRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flexGrow: 1,
    maxWidth: "400px",
  },
  shipmentChips: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  detailLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalL),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  timelineEvent: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    minHeight: "64px",
  },
  timelineDot: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "24px",
    flexShrink: 0,
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    flexShrink: 0,
  },
  dotFuture: {
    backgroundColor: tokens.colorNeutralBackground5,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
  },
  dotLine: {
    width: "2px",
    flexGrow: 1,
    backgroundColor: tokens.colorNeutralStroke1,
    marginTop: "4px",
    marginBottom: "4px",
  },
  timelineContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    ...shorthands.padding("0", "0", tokens.spacingVerticalM, "0"),
  },
  proofCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalL),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  proofRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  locationButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    color: tokens.colorBrandForeground1,
    ":hover": {
      textDecorationLine: "underline",
    },
  },
  miniMapContainer: {
    height: "220px",
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.overflow("hidden"),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalS,
  },
});

const EXPECTED_STEPS = ["Order Placed", "Picked", "Packed", "In Transit", "Delivered"];

export function ShipmentTrackingPage() {
  const styles = useStyles();
  const location = useLocation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchId, setSearchId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<atlas.Map | null>(null);

  const locationState = location.state as { shipmentId?: string } | null;

  useEffect(() => {
    d365McpClient.initialize();
    d365McpClient.getWarehouseShipments().then((s) => {
      setShipments(s);
      setIsLoading(false);
    });
  }, []);

  // Auto-track when navigated from another page with shipmentId in state
  const hasAutoTracked = useRef(false);
  useEffect(() => {
    if (!hasAutoTracked.current && locationState?.shipmentId && !isLoading) {
      hasAutoTracked.current = true;
      setSearchId(locationState.shipmentId);
      handleTrack(locationState.shipmentId);
    }
  }, [locationState, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTrack = async (id: string) => {
    setSelectedId(id);
    setTrackingLoading(true);
    setShowLocationMap(false);
    // The useEffect cleanup will dispose the previous minimap
    const [t, s] = await Promise.all([
      d365McpClient.getShipmentTracking(id),
      d365McpClient.checkShipmentStatus(id),
    ]);
    setTracking(t);
    setShipment(s);
    setTrackingLoading(false);
  };

  // Initialize mini map when revealed
  useEffect(() => {
    if (!showLocationMap || !miniMapRef.current || !tracking?.currentLocation) return;
    if (miniMapInstanceRef.current) return; // already initialized

    const loc = tracking.currentLocation.coordinates;
    const map = new atlas.Map(miniMapRef.current, {
      center: [loc.lng, loc.lat],
      zoom: 13,
      authOptions: {
        authType: "subscriptionKey" as atlas.AuthenticationType,
        subscriptionKey: import.meta.env.VITE_AZURE_MAPS_KEY,
      },
    });
    miniMapInstanceRef.current = map;

    map.events.add("ready", () => {
      // Add a truck marker
      map.markers.add(
        new atlas.HtmlMarker({
          position: [loc.lng, loc.lat],
          htmlContent: `<div style="
            background: #0078D4;
            color: white;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 700;
            font-family: 'Segoe UI', sans-serif;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
          "><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>${tracking.currentLocation?.label ?? ""}</div>`,
        }),
      );
    });

    return () => {
      if (miniMapInstanceRef.current === map) {
        try { map.dispose(); } catch { /* already disposed */ }
        miniMapInstanceRef.current = null;
      }
    };
  }, [showLocationMap, tracking]);

  const handleSearch = () => {
    if (searchId.trim()) handleTrack(searchId.trim());
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Shipment Tracking</Text>
          <Text size={200}>Live shipment tracking with status timeline</Text>
        </div>
        <div className={styles.loadingContainer}><Spinner label="Loading shipments..." /></div>
      </div>
    );
  }

  const completedSteps = tracking?.events.map((e) => e.status) || [];

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">Shipment Tracking</Text>
        <Text size={200}>Live shipment tracking with status timeline</Text>
      </div>

      <div className={styles.searchRow}>
        <Input
          className={styles.searchInput}
          placeholder="Enter shipment ID (e.g. SH-2026-001)"
          value={searchId}
          onChange={(_, data) => setSearchId(data.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          contentBefore={<Search24Regular />}
        />
        <Button appearance="primary" onClick={handleSearch}>Track</Button>
      </div>

      <div className={styles.shipmentChips}>
        {shipments.map((s) => (
          <Button
            key={s.id}
            appearance={selectedId === s.shipmentId ? "primary" : "secondary"}
            size="small"
            onClick={() => { setSearchId(s.shipmentId); handleTrack(s.shipmentId); }}
          >
            {s.shipmentId}
          </Button>
        ))}
      </div>

      {!selectedId && (
        <div className={styles.emptyState}>
          <VehicleTruckProfile24Regular style={{ fontSize: "48px" }} />
          <Text size={300}>Select or search for a shipment to view tracking details</Text>
        </div>
      )}

      {trackingLoading && (
        <div className={styles.loadingContainer}><Spinner label="Loading tracking data..." /></div>
      )}

      {selectedId && !trackingLoading && !tracking && (
        <div className={styles.emptyState}>
          <Text size={300}>No tracking data available for {selectedId}</Text>
        </div>
      )}

      {selectedId && !trackingLoading && tracking && (
        <>
          <div className={styles.detailLayout}>
            {/* Shipment Detail Card */}
            <Card className={styles.detailCard}>
              <Text weight="semibold" size={400}>Shipment Details</Text>
              <Divider />
              <div className={styles.detailRow}>
                <Text size={200}>Shipment ID</Text>
                <Text weight="semibold">{tracking.shipmentId}</Text>
              </div>
              {shipment && (
                <>
                  <div className={styles.detailRow}>
                    <Text size={200}>Status</Text>
                    <Badge appearance="filled" color={shipment.status === "delivered" ? "success" : shipment.status === "delayed" ? "danger" : "brand"}>
                      {shipment.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className={styles.detailRow}>
                    <Text size={200}>Origin</Text>
                    <Text size={200}>{shipment.origin.label}</Text>
                  </div>
                  <div className={styles.detailRow}>
                    <Text size={200}>Destination</Text>
                    <Text size={200}>{shipment.destination.label}</Text>
                  </div>
                  <div className={styles.detailRow}>
                    <Text size={200}>Customer</Text>
                    <Text size={200}>{shipment.customerName}</Text>
                  </div>
                  <div className={styles.detailRow}>
                    <Text size={200}>Priority</Text>
                    <Badge appearance="outline" color={shipment.priority === "urgent" ? "danger" : shipment.priority === "express" ? "warning" : "informative"}>
                      {shipment.priority}
                    </Badge>
                  </div>
                </>
              )}
              <div className={styles.detailRow}>
                <Text size={200}>Estimated Delivery</Text>
                <Text size={200}>{new Date(tracking.estimatedDelivery).toLocaleString()}</Text>
              </div>
              {tracking.currentLocation && (
                <>
                  <div className={styles.detailRow}>
                    <Text size={200}>Current Location</Text>
                    <div
                      className={styles.locationButton}
                      onClick={() => setShowLocationMap((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowLocationMap((prev) => !prev); }}
                    >
                      {showLocationMap ? <Map24Regular /> : <Location24Regular />}
                      <Text size={200} style={{ color: "inherit" }}>{tracking.currentLocation.label}</Text>
                    </div>
                  </div>
                  {showLocationMap && (
                    <div ref={miniMapRef} className={styles.miniMapContainer} />
                  )}
                </>
              )}
            </Card>

            {/* Timeline Card */}
            <Card className={styles.detailCard}>
              <Text weight="semibold" size={400}>Tracking Timeline</Text>
              <Divider />
              <div className={styles.timeline}>
                {EXPECTED_STEPS.map((step, idx) => {
                  const event = tracking.events.find((e) => e.status === step);
                  const isComplete = completedSteps.includes(step);
                  const isLast = idx === EXPECTED_STEPS.length - 1;
                  return (
                    <div key={step} className={styles.timelineEvent}>
                      <div className={styles.timelineDot}>
                        <div className={isComplete ? styles.dot : `${styles.dot} ${styles.dotFuture}`} />
                        {!isLast && <div className={styles.dotLine} />}
                      </div>
                      <div className={styles.timelineContent}>
                        <Text weight="semibold" size={300} style={{ color: isComplete ? undefined : tokens.colorNeutralForeground4 }}>
                          {step}
                        </Text>
                        {event ? (
                          <>
                            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                              {new Date(event.timestamp).toLocaleString()} — {event.location}
                            </Text>
                            <Text size={200}>{event.description}</Text>
                          </>
                        ) : (
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>Pending</Text>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Proof of Delivery */}
          {tracking.proofOfDelivery && (
            <Card className={styles.proofCard}>
              <Text weight="semibold" size={400}>Proof of Delivery</Text>
              <Divider />
              <div className={styles.proofRow}>
                <DocumentCheckmark24Regular />
                <Text size={200}>Signature: {tracking.proofOfDelivery.signature ? "Collected" : "Not collected"}</Text>
                <Badge appearance="filled" color={tracking.proofOfDelivery.signature ? "success" : "warning"} size="small">
                  {tracking.proofOfDelivery.signature ? "Yes" : "No"}
                </Badge>
              </div>
              <div className={styles.proofRow}>
                <Box24Regular />
                <Text size={200}>Photo: {tracking.proofOfDelivery.photo ? "Taken" : "Not taken"}</Text>
                <Badge appearance="filled" color={tracking.proofOfDelivery.photo ? "success" : "warning"} size="small">
                  {tracking.proofOfDelivery.photo ? "Yes" : "No"}
                </Badge>
              </div>
              <div className={styles.proofRow}>
                <Checkmark24Regular />
                <Text size={200}>Delivered at: {new Date(tracking.proofOfDelivery.timestamp).toLocaleString()}</Text>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
