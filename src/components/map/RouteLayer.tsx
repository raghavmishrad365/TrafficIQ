import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { RouteOption } from "../../types/journey";
import { useTheme } from "../../context/ThemeContext";

interface RouteLayerProps {
  map: atlas.Map | null;
  routes: RouteOption[];
}

export function RouteLayer({ map, routes }: RouteLayerProps) {
  const dataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const layerRef = useRef<atlas.layer.LineLayer | null>(null);
  const { resolvedTheme } = useTheme();

  const brandColor = resolvedTheme === "dark" ? "#4EA8DE" : "#0078D4";
  const altRouteColor = resolvedTheme === "dark" ? "#666666" : "#888888";

  // Initialize data source and layer once the map is available
  useEffect(() => {
    if (!map) return;

    const dataSource = new atlas.source.DataSource();
    map.sources.add(dataSource);
    dataSourceRef.current = dataSource;

    const lineLayer = new atlas.layer.LineLayer(dataSource, undefined, {
      strokeWidth: 5,
      strokeColor: [
        "case",
        ["==", ["get", "isRecommended"], true],
        brandColor,
        altRouteColor,
      ],
      strokeOpacity: [
        "case",
        ["==", ["get", "isRecommended"], true],
        0.9,
        0.6,
      ],
    });

    map.layers.add(lineLayer);
    layerRef.current = lineLayer;

    return () => {
      if (map && dataSourceRef.current) {
        try {
          if (layerRef.current) {
            map.layers.remove(layerRef.current);
          }
          map.sources.remove(dataSourceRef.current);
        } catch {
          // Map may already be disposed
        }
      }
      dataSourceRef.current = null;
      layerRef.current = null;
    };
  }, [map, brandColor, altRouteColor]);

  // Update route features when routes prop changes
  useEffect(() => {
    if (!dataSourceRef.current || !map) return;

    dataSourceRef.current.clear();

    if (routes.length === 0) return;

    const features = routes.map(
      (route) =>
        new atlas.data.Feature(
          new atlas.data.LineString(route.coordinates),
          {
            id: route.id,
            summary: route.summary,
            isRecommended: route.isRecommended,
            durationMinutes: route.durationMinutes,
            distanceKm: route.distanceKm,
          }
        )
    );

    dataSourceRef.current.add(features);

    // Fit map camera to show all routes
    const allCoords = routes.flatMap((r) => r.coordinates);
    if (allCoords.length > 0) {
      const boundingBox = atlas.data.BoundingBox.fromPositions(allCoords);
      map.setCamera({
        bounds: boundingBox,
        padding: 50,
      });
    }
  }, [map, routes]);

  return null;
}
