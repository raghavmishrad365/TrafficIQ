import { useRef, useEffect, useState, useCallback } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import {
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { useTheme } from "../../context/ThemeContext";
import { useMapSettings } from "../../context/MapSettingsContext";
import type { FleetVehicle, FleetVehicleStatus } from "../../types/supplychain";
import type { LocationWeather } from "../../types/map";
import { WeatherOverlay } from "./WeatherOverlay";
import { MapControls } from "./MapControls";

const useStyles = makeStyles({
  wrapper: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  legend: {
    position: "absolute" as const,
    bottom: tokens.spacingVerticalM,
    left: tokens.spacingHorizontalM,
    display: "flex",
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    zIndex: 1,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    fontSize: tokens.fontSizeBase100,
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
});

const STATUS_COLORS: Record<FleetVehicleStatus, string> = {
  in_transit: "#2ecc71",
  idle: "#f39c12",
  maintenance: "#e74c3c",
  returning: "#3498db",
};

const STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  in_transit: "In Transit",
  idle: "Idle",
  maintenance: "Maintenance",
  returning: "Returning",
};

interface FleetMapProps {
  vehicles: FleetVehicle[];
  onVehicleClick?: (vehicleId: string) => void;
  enableClustering?: boolean;
  weatherData?: LocationWeather[];
  className?: string;
}

export function FleetMap({ vehicles, onVehicleClick, enableClustering = false, weatherData, className }: FleetMapProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const popupRef = useRef<atlas.Popup | null>(null);
  const clusterDataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const clusterLayersAddedRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const {
    showTraffic,
    mapStyle,
    defaultLanguage,
    defaultCenter: globalCenter,
    setShowTraffic,
    setMapStyle,
    showWeather,
    setShowWeather,
    enableClustering: globalClustering,
    setEnableClustering,
  } = useMapSettings();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new atlas.Map(containerRef.current, {
      center: [globalCenter.lng, globalCenter.lat],
      zoom: 10,
      language: defaultLanguage,
      authOptions: {
        authType: "subscriptionKey" as atlas.AuthenticationType,
        subscriptionKey: import.meta.env.VITE_AZURE_MAPS_KEY,
      },
    });

    mapRef.current = map;

    map.events.add("ready", () => {
      setMapReady(true);

      map.setTraffic({
        flow: showTraffic ? "relative" : "none",
        incidents: showTraffic,
      });

      popupRef.current = new atlas.Popup({
        pixelOffset: [0, -20],
        closeButton: true,
      });
    });

    return () => {
      setMapReady(false);
      mapRef.current?.dispose();
      mapRef.current = null;
      markersRef.current = [];
      popupRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute effective atlas style from global setting + theme
  const atlasStyle =
    mapStyle === "satellite"
      ? "satellite_road_labels"
      : mapStyle === "night"
        ? "night"
        : resolvedTheme === "dark"
          ? "night"
          : "road";

  const cycleMapStyle = useCallback(() => {
    const order: Array<"road" | "satellite" | "night"> = ["road", "satellite", "night"];
    const idx = order.indexOf(mapStyle);
    setMapStyle(order[(idx + 1) % order.length]);
  }, [mapStyle, setMapStyle]);

  // Update map style
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.setStyle({ style: atlasStyle });
  }, [atlasStyle, mapReady]);

  // Update traffic visibility
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.setTraffic({
      flow: showTraffic ? "relative" : "none",
      incidents: showTraffic,
    });
  }, [showTraffic, mapReady]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // Clear existing markers
    for (const marker of markersRef.current) {
      map.markers.remove(marker);
    }
    markersRef.current = [];

    if (vehicles.length === 0) return;

    // If clustering is enabled, populate the cluster DataSource instead of HtmlMarkers
    if (enableClustering) {
      if (!clusterDataSourceRef.current) {
        clusterDataSourceRef.current = new atlas.source.DataSource(undefined, {
          cluster: true,
          clusterRadius: 45,
        });
        map.sources.add(clusterDataSourceRef.current);
      }

      // Clear previous features
      clusterDataSourceRef.current.clear();

      // Add vehicle positions as GeoJSON Point features
      const features = vehicles.map((vehicle) => {
        return new atlas.data.Feature(
          new atlas.data.Point([
            vehicle.currentLocation.coordinates.lng,
            vehicle.currentLocation.coordinates.lat,
          ]),
          {
            vehicleId: vehicle.vehicleId,
            status: vehicle.status,
            licensePlate: vehicle.licensePlate,
            driverName: vehicle.driverName,
            speedKmh: vehicle.speedKmh,
            loadPercent: vehicle.loadPercent,
            fuelLevelPercent: vehicle.fuelLevelPercent,
            locationLabel: vehicle.currentLocation.label,
          }
        );
      });
      clusterDataSourceRef.current.add(features);

      // Add cluster layers if not already added
      if (!clusterLayersAddedRef.current) {
        // BubbleLayer for clustered points
        map.layers.add(
          new atlas.layer.BubbleLayer(clusterDataSourceRef.current, "fleet-cluster-bubbles", {
            radius: [
              "step",
              ["get", "point_count"],
              15,   // default radius
              10, 20, // 10+ points -> radius 20
              50, 25, // 50+ points -> radius 25
            ],
            color: "#CA5010",
            strokeColor: "#fff",
            strokeWidth: 2,
            filter: ["has", "point_count"],
          })
        );

        // SymbolLayer for cluster count text labels
        map.layers.add(
          new atlas.layer.SymbolLayer(clusterDataSourceRef.current, "fleet-cluster-labels", {
            iconOptions: { image: "none" },
            textOptions: {
              textField: ["get", "point_count_abbreviated"],
              offset: [0, 0],
              size: 14,
              color: "#fff",
              font: ["StandardFont-Bold"],
            },
            filter: ["has", "point_count"],
          })
        );

        // SymbolLayer for unclustered individual points
        map.layers.add(
          new atlas.layer.SymbolLayer(clusterDataSourceRef.current, "fleet-unclustered-points", {
            iconOptions: {
              image: "marker-blue",
              allowOverlap: true,
              size: 0.8,
            },
            textOptions: {
              textField: ["get", "vehicleId"],
              offset: [0, 1.2],
              size: 11,
              color: "#333",
              haloColor: "#fff",
              haloWidth: 1,
              font: ["StandardFont-Bold"],
            },
            filter: ["!", ["has", "point_count"]],
          })
        );

        clusterLayersAddedRef.current = true;
      }
    } else {
      const isDark = resolvedTheme === "dark";
      const textColor = isDark ? "#fff" : "#fff";
      const shadowColor = isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)";

      // Add a marker for each vehicle
      for (const vehicle of vehicles) {
        const color = STATUS_COLORS[vehicle.status];
        const lng = vehicle.currentLocation.coordinates.lng;
        const lat = vehicle.currentLocation.coordinates.lat;

        const marker = new atlas.HtmlMarker({
          position: [lng, lat],
          htmlContent: `<div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${color};
            color: ${textColor};
            padding: 3px 8px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 600;
            font-family: 'Segoe UI', sans-serif;
            white-space: nowrap;
            box-shadow: 0 2px 8px ${shadowColor};
            border: 2px solid white;
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${textColor}"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
            ${vehicle.vehicleId}
          </div>`,
        });

        map.events.add("click", marker, () => {
          if (popupRef.current && mapRef.current) {
            const shipmentInfo = vehicle.currentShipmentId
              ? `<div style="font-size: 12px; margin-bottom: 2px;">Shipment: <a href="/tracking?id=${vehicle.currentShipmentId}" style="color: #0078D4; text-decoration: none;">${vehicle.currentShipmentId}</a></div>`
              : "";
            popupRef.current.setOptions({
              position: [lng, lat],
              content: `<div style="
                padding: 12px 16px;
                font-family: 'Segoe UI', sans-serif;
                min-width: 220px;
              ">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${color}"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                  <span style="font-weight: 700; font-size: 14px;">${vehicle.vehicleId}</span>
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${vehicle.licensePlate}</div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${color};
                  "></span>
                  <span style="font-size: 12px; font-weight: 600;">${STATUS_LABELS[vehicle.status]}</span>
                </div>
                <div style="font-size: 12px; margin-bottom: 2px;">Driver: ${vehicle.driverName}</div>
                <div style="font-size: 12px; margin-bottom: 2px;">Speed: ${vehicle.speedKmh} km/h</div>
                <div style="font-size: 12px; margin-bottom: 2px;">Load: ${vehicle.loadPercent}%</div>
                <div style="font-size: 12px; margin-bottom: 2px;">Fuel: ${vehicle.fuelLevelPercent}%</div>
                ${shipmentInfo}
                <div style="font-size: 12px; color: #888; margin-bottom: 6px;">${vehicle.currentLocation.label}</div>
                <a href="/fleet" style="font-size: 12px; color: #0078D4; text-decoration: none; font-weight: 600;">View Fleet Details &rarr;</a>
              </div>`,
            });
            popupRef.current.open(mapRef.current);
          }
          onVehicleClick?.(vehicle.vehicleId);
        });

        map.markers.add(marker);
        markersRef.current.push(marker);
      }
    }

    // Fit camera to show all vehicles
    const allPoints: [number, number][] = vehicles.map(
      (v) => [v.currentLocation.coordinates.lng, v.currentLocation.coordinates.lat] as [number, number]
    );

    if (allPoints.length > 1) {
      const boundingBox = atlas.data.BoundingBox.fromPositions(allPoints);
      map.setCamera({
        bounds: boundingBox,
        padding: 80,
      });
    } else if (allPoints.length === 1) {
      map.setCamera({
        center: allPoints[0],
        zoom: 12,
      });
    }
  }, [vehicles, mapReady, resolvedTheme, onVehicleClick, enableClustering]);

  // Control handlers
  const handleZoomIn = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getCamera().zoom ?? 10;
    mapRef.current.setCamera({ zoom: zoom + 1 });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getCamera().zoom ?? 10;
    mapRef.current.setCamera({ zoom: zoom - 1 });
  }, []);

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <div ref={containerRef} className={styles.container} />

      <MapControls
        showTraffic={showTraffic}
        onToggleTraffic={() => setShowTraffic(!showTraffic)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        mapStyle={mapStyle}
        onCycleMapStyle={cycleMapStyle}
        showWeather={showWeather}
        onToggleWeather={() => setShowWeather(!showWeather)}
        enableClustering={enableClustering}
        onToggleClustering={() => setEnableClustering(!globalClustering)}
      />

      {/* Legend */}
      <div className={styles.legend}>
        {(Object.keys(STATUS_COLORS) as FleetVehicleStatus[]).map((status) => (
          <div key={status} className={styles.legendItem}>
            <div
              className={styles.legendDot}
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      <WeatherOverlay map={mapReady ? mapRef.current : null} weatherData={weatherData || []} />
    </div>
  );
}
