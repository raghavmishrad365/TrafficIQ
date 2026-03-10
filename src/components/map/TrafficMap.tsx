import { useRef, useEffect, useCallback, useState } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import type { MapBounds, Coordinates, LocationWeather, PointOfInterest } from "../../types/map";
import type { TrafficIncident } from "../../types/traffic";
import type { RouteOption } from "../../types/journey";
import { useTheme } from "../../context/ThemeContext";
import { useMapSettings } from "../../context/MapSettingsContext";
import { WeatherOverlay } from "./WeatherOverlay";
import { POIMarkers } from "./POIMarkers";
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

interface TrafficMapProps {
  center?: Coordinates;
  zoom?: number;
  showTraffic?: boolean;
  routes?: RouteOption[];
  selectedRouteId?: string;
  incidents?: TrafficIncident[];
  weatherData?: LocationWeather[];
  pois?: PointOfInterest[];
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

export function TrafficMap({
  center,
  zoom,
  showTraffic,
  routes = [],
  selectedRouteId,
  incidents = [],
  weatherData,
  pois,
  onBoundsChange,
  className,
}: TrafficMapProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const routeDataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const incidentDataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const popupRef = useRef<atlas.Popup | null>(null);
  const { resolvedTheme } = useTheme();
  const mapSettings = useMapSettings();

  // Use global settings as defaults; props can override
  const effectiveShowTraffic = showTraffic ?? mapSettings.showTraffic;
  const effectiveMapStyle =
    mapSettings.mapStyle === "satellite"
      ? "satellite_road_labels"
      : mapSettings.mapStyle === "night"
        ? "night"
        : resolvedTheme === "dark"
          ? "night"
          : "road";

  const cycleMapStyle = useCallback(() => {
    const order: Array<"road" | "satellite" | "night"> = ["road", "satellite", "night"];
    const idx = order.indexOf(mapSettings.mapStyle);
    mapSettings.setMapStyle(order[(idx + 1) % order.length]);
  }, [mapSettings]);

  const brandColor = resolvedTheme === "dark" ? "#4EA8DE" : "#0078D4";
  const altRouteColor = resolvedTheme === "dark" ? "#666666" : "#AAAAAA";

  const handleBoundsChange = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;

    const camera = mapRef.current.getCamera();
    const bounds = camera.bounds;

    if (bounds) {
      const boundingBox = bounds as atlas.data.BoundingBox;
      onBoundsChange({
        west: atlas.data.BoundingBox.getWest(boundingBox),
        south: atlas.data.BoundingBox.getSouth(boundingBox),
        east: atlas.data.BoundingBox.getEast(boundingBox),
        north: atlas.data.BoundingBox.getNorth(boundingBox),
      });
    }
  }, [onBoundsChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new atlas.Map(containerRef.current, {
      center: [mapSettings.defaultCenter.lng, mapSettings.defaultCenter.lat],
      zoom: mapSettings.defaultZoom,
      language: mapSettings.defaultLanguage,
      authOptions: {
        authType: "subscriptionKey" as atlas.AuthenticationType,
        subscriptionKey: import.meta.env.VITE_AZURE_MAPS_KEY,
      },
    });

    mapRef.current = map;

    map.events.add("ready", () => {
      setMapReady(true);

      // Enable traffic flow and incidents
      map.setTraffic({
        flow: effectiveShowTraffic ? "relative" : "none",
        incidents: effectiveShowTraffic,
      });

      // Create DataSource for routes
      const routeDataSource = new atlas.source.DataSource();
      map.sources.add(routeDataSource);
      routeDataSourceRef.current = routeDataSource;

      map.layers.add(
        new atlas.layer.LineLayer(routeDataSource, undefined, {
          strokeWidth: [
            "case",
            ["==", ["get", "isSelected"], true],
            7,
            4,
          ],
          strokeColor: [
            "case",
            ["==", ["get", "isSelected"], true],
            brandColor,
            ["==", ["get", "isRecommended"], true],
            brandColor,
            altRouteColor,
          ],
          strokeOpacity: [
            "case",
            ["==", ["get", "isSelected"], true],
            1,
            0.5,
          ],
        })
      );

      // Create DataSource for incidents
      const incidentDataSource = new atlas.source.DataSource();
      map.sources.add(incidentDataSource);
      incidentDataSourceRef.current = incidentDataSource;

      const incidentLayer = new atlas.layer.SymbolLayer(
        incidentDataSource,
        undefined,
        {
          iconOptions: {
            image: "pin-red",
            allowOverlap: true,
            size: 0.8,
          },
        }
      );
      map.layers.add(incidentLayer);

      // Add popup for incidents
      const popup = new atlas.Popup({
        pixelOffset: [0, -18],
        closeButton: true,
      });
      popupRef.current = popup;

      map.events.add("click", incidentLayer, (e: atlas.MapMouseEvent) => {
        if (
          e.shapes &&
          e.shapes.length > 0
        ) {
          const shape = e.shapes[0];
          let properties: Record<string, unknown>;
          let position: atlas.data.Position;

          if (shape instanceof atlas.Shape) {
            properties = shape.getProperties();
            const geo = shape.getCoordinates();
            position = geo as atlas.data.Position;
          } else {
            const feature = shape as atlas.data.Feature<atlas.data.Geometry, Record<string, unknown>>;
            properties = feature.properties ?? {};
            const point = feature.geometry as atlas.data.Point;
            position = point.coordinates;
          }

          popup.setOptions({
            content: `<div style="padding: 8px;">
              <strong>${properties.title ?? ""}</strong>
              <p style="margin: 4px 0 0 0;">${properties.description ?? ""}</p>
            </div>`,
            position,
          });
          popup.open(map);
        }
      });
    });

    map.events.add("moveend", () => {
      handleBoundsChange();
    });

    return () => {
      setMapReady(false);
      mapRef.current?.dispose();
      mapRef.current = null;
      routeDataSourceRef.current = null;
      incidentDataSourceRef.current = null;
      popupRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map style based on global settings
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    mapRef.current.setStyle({
      style: effectiveMapStyle,
    });
  }, [effectiveMapStyle, mapReady]);

  // Update center and zoom
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const cameraOptions: atlas.CameraOptions = {};
    if (center) {
      cameraOptions.center = [center.lng, center.lat];
    }
    if (zoom !== undefined) {
      cameraOptions.zoom = zoom;
    }
    if (cameraOptions.center || cameraOptions.zoom !== undefined) {
      mapRef.current.setCamera(cameraOptions);
    }
  }, [center, zoom, mapReady]);

  // Update traffic visibility
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    mapRef.current.setTraffic({
      flow: effectiveShowTraffic ? "relative" : "none",
      incidents: effectiveShowTraffic,
    });
  }, [effectiveShowTraffic, mapReady]);

  // Update routes
  useEffect(() => {
    if (!routeDataSourceRef.current || !mapReady) return;

    routeDataSourceRef.current.clear();

    const features = routes.map(
      (route) =>
        new atlas.data.Feature(
          new atlas.data.LineString(route.coordinates),
          {
            id: route.id,
            summary: route.summary,
            isRecommended: route.isRecommended,
            isSelected: route.id === selectedRouteId,
          }
        )
    );

    if (features.length > 0) {
      routeDataSourceRef.current.add(features);

      // Fit the camera to show all routes
      const allCoords = routes.flatMap((r) => r.coordinates);
      if (allCoords.length > 0 && mapRef.current) {
        const boundingBox = atlas.data.BoundingBox.fromPositions(allCoords);
        mapRef.current.setCamera({
          bounds: boundingBox,
          padding: 40,
        });
      }
    }
  }, [routes, selectedRouteId, mapReady]);

  // Update incidents
  useEffect(() => {
    if (!incidentDataSourceRef.current || !mapReady) return;

    incidentDataSourceRef.current.clear();

    const features = incidents.map(
      (incident) =>
        new atlas.data.Feature(
          new atlas.data.Point([
            incident.location.lng,
            incident.location.lat,
          ]),
          {
            id: incident.id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            type: incident.type,
          }
        )
    );

    if (features.length > 0) {
      incidentDataSourceRef.current.add(features);
    }
  }, [incidents, mapReady]);

  // Control handlers
  const handleZoomIn = useCallback(() => {
    if (!mapRef.current) return;
    const z = mapRef.current.getCamera().zoom ?? 10;
    mapRef.current.setCamera({ zoom: z + 1 });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapRef.current) return;
    const z = mapRef.current.getCamera().zoom ?? 10;
    mapRef.current.setCamera({ zoom: z - 1 });
  }, []);

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <div
        ref={containerRef}
        className={styles.container}
      />
      <MapControls
        showTraffic={effectiveShowTraffic}
        onToggleTraffic={() => mapSettings.setShowTraffic(!effectiveShowTraffic)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        mapStyle={mapSettings.mapStyle}
        onCycleMapStyle={cycleMapStyle}
        showWeather={mapSettings.showWeather}
        onToggleWeather={() => mapSettings.setShowWeather(!mapSettings.showWeather)}
        showPOIs={mapSettings.showPOIs}
        onTogglePOIs={() => mapSettings.setShowPOIs(!mapSettings.showPOIs)}
      />
      <WeatherOverlay map={mapReady ? mapRef.current : null} weatherData={weatherData || []} />
      <POIMarkers map={mapReady ? mapRef.current : null} pois={pois || []} />
    </div>
  );
}
