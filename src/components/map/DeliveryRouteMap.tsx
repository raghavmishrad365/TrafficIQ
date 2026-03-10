import { useRef, useEffect, useState, useCallback } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import {
  makeStyles,
  mergeClasses,
} from "@fluentui/react-components";
import { useTheme } from "../../context/ThemeContext";
import { useMapSettings } from "../../context/MapSettingsContext";
import type { Location } from "../../types/journey";
import type { LocationWeather, PointOfInterest, ReachableRange } from "../../types/map";
import { WeatherOverlay } from "./WeatherOverlay";
import { POIMarkers } from "./POIMarkers";
import { ReachableRangeOverlay } from "./ReachableRangeOverlay";
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
});

export interface DeliveryMapStop {
  shipmentId: string;
  customerName: string;
  destination: string;
  location: Location;
  order: number;
}

interface DeliveryRouteMapProps {
  warehouseLocation?: Location;
  stops?: DeliveryMapStop[];
  routeCoordinates?: [number, number][];
  weatherData?: LocationWeather[];
  pois?: PointOfInterest[];
  reachableRanges?: ReachableRange[];
  className?: string;
}

export function DeliveryRouteMap({
  warehouseLocation,
  stops = [],
  routeCoordinates = [],
  weatherData,
  pois,
  reachableRanges,
  className,
}: DeliveryRouteMapProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const routeDataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const { resolvedTheme } = useTheme();
  const { showTraffic, mapStyle, defaultLanguage, defaultCenter: globalCenter, setShowTraffic, setMapStyle, showWeather, setShowWeather, showPOIs, setShowPOIs } = useMapSettings();

  const brandColor = resolvedTheme === "dark" ? "#4EA8DE" : "#0078D4";

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new atlas.Map(containerRef.current, {
      center: [globalCenter.lng, globalCenter.lat],
      zoom: 7,
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

      const routeDS = new atlas.source.DataSource();
      map.sources.add(routeDS);
      routeDataSourceRef.current = routeDS;

      map.layers.add(
        new atlas.layer.LineLayer(routeDS, undefined, {
          strokeWidth: 5,
          strokeColor: brandColor,
          strokeOpacity: 0.85,
          lineJoin: "round",
          lineCap: "round",
        })
      );
    });

    return () => {
      setMapReady(false);
      mapRef.current?.dispose();
      mapRef.current = null;
      routeDataSourceRef.current = null;
      markersRef.current = [];
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

  // Center on warehouse when no stops
  useEffect(() => {
    if (!mapRef.current || !mapReady || !warehouseLocation) return;
    if (stops.length === 0) {
      mapRef.current.setCamera({
        center: [
          warehouseLocation.coordinates.lng,
          warehouseLocation.coordinates.lat,
        ],
        zoom: 10,
      });
    }
  }, [warehouseLocation, stops.length, mapReady]);

  // Update route line + markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // Clear existing markers
    for (const marker of markersRef.current) {
      map.markers.remove(marker);
    }
    markersRef.current = [];

    // Clear route
    if (routeDataSourceRef.current) {
      routeDataSourceRef.current.clear();
    }

    if (!warehouseLocation) return;

    // Add warehouse marker
    const whMarker = new atlas.HtmlMarker({
      position: [
        warehouseLocation.coordinates.lng,
        warehouseLocation.coordinates.lat,
      ],
      htmlContent: `<div style="
        background: ${brandColor};
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        font-family: 'Segoe UI', sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">&#x1F3ED; Warehouse</div>`,
    });
    map.markers.add(whMarker);
    markersRef.current.push(whMarker);

    if (stops.length === 0) return;

    // Add numbered stop markers
    for (const stop of stops) {
      const lng = stop.location.coordinates.lng;
      const lat = stop.location.coordinates.lat;

      const stopMarker = new atlas.HtmlMarker({
        position: [lng, lat],
        htmlContent: `<div style="
          width: 28px;
          height: 28px;
          background: ${brandColor};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Segoe UI', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">${stop.order}</div>`,
      });
      map.markers.add(stopMarker);
      markersRef.current.push(stopMarker);
    }

    // Use real road coordinates if available, otherwise straight lines
    const lineCoords: [number, number][] =
      routeCoordinates.length > 0
        ? routeCoordinates
        : [
            [
              warehouseLocation.coordinates.lng,
              warehouseLocation.coordinates.lat,
            ],
            ...stops.map(
              (s) =>
                [
                  s.location.coordinates.lng,
                  s.location.coordinates.lat,
                ] as [number, number]
            ),
          ];

    // Add route line
    if (routeDataSourceRef.current && lineCoords.length > 1) {
      routeDataSourceRef.current.add(
        new atlas.data.Feature(new atlas.data.LineString(lineCoords))
      );
    }

    // Fit camera to show all points
    const allPoints: [number, number][] = [
      [warehouseLocation.coordinates.lng, warehouseLocation.coordinates.lat],
      ...stops.map(
        (s) =>
          [s.location.coordinates.lng, s.location.coordinates.lat] as [
            number,
            number,
          ]
      ),
    ];
    if (allPoints.length > 1) {
      const boundingBox = atlas.data.BoundingBox.fromPositions(allPoints);
      map.setCamera({
        bounds: boundingBox,
        padding: 60,
      });
    }
  }, [warehouseLocation, stops, routeCoordinates, mapReady, brandColor]);

  // Control handlers
  const handleZoomIn = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getCamera().zoom ?? 7;
    mapRef.current.setCamera({ zoom: zoom + 1 });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getCamera().zoom ?? 7;
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
        showPOIs={showPOIs}
        onTogglePOIs={() => setShowPOIs(!showPOIs)}
      />

      <WeatherOverlay map={mapReady ? mapRef.current : null} weatherData={weatherData || []} />
      <POIMarkers map={mapReady ? mapRef.current : null} pois={pois || []} />
      <ReachableRangeOverlay map={mapReady ? mapRef.current : null} ranges={reachableRanges || []} />
    </div>
  );
}
