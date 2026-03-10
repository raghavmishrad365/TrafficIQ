import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { TrafficIncident } from "../../types/traffic";
import type { Severity } from "../../types/traffic";
import { useTheme } from "../../context/ThemeContext";

const SEVERITY_COLORS_LIGHT: Record<Severity | "default", string> = {
  low: "#0E7A0D",
  medium: "#C19C00",
  high: "#DA3B01",
  critical: "#A4262C",
  default: "#9E9E9E",
};

const SEVERITY_COLORS_DARK: Record<Severity | "default", string> = {
  low: "#359B35",
  medium: "#FFD335",
  high: "#F7630C",
  critical: "#FF4343",
  default: "#9E9E9E",
};

function getSeverityColor(severity: Severity, isDark: boolean): string {
  const colors = isDark ? SEVERITY_COLORS_DARK : SEVERITY_COLORS_LIGHT;
  return colors[severity] ?? colors.default;
}

interface IncidentMarkersProps {
  map: atlas.Map | null;
  incidents: TrafficIncident[];
}

export function IncidentMarkers({ map, incidents }: IncidentMarkersProps) {
  const dataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const popupRef = useRef<atlas.Popup | null>(null);
  const layerRef = useRef<atlas.layer.BubbleLayer | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const colors = isDark ? SEVERITY_COLORS_DARK : SEVERITY_COLORS_LIGHT;

  // Initialize data source, bubble layer, and popup
  useEffect(() => {
    if (!map) return;

    const dataSource = new atlas.source.DataSource();
    map.sources.add(dataSource);
    dataSourceRef.current = dataSource;

    const bubbleLayer = new atlas.layer.BubbleLayer(dataSource, undefined, {
      radius: 8,
      strokeWidth: 2,
      strokeColor: isDark ? "#333333" : "white",
      color: [
        "match",
        ["get", "severity"],
        "low",
        colors.low,
        "medium",
        colors.medium,
        "high",
        colors.high,
        "critical",
        colors.critical,
        colors.default,
      ],
      opacity: 0.85,
    });

    map.layers.add(bubbleLayer);
    layerRef.current = bubbleLayer;

    // Create popup for incident details
    const popup = new atlas.Popup({
      pixelOffset: [0, -12],
      closeButton: true,
    });
    popupRef.current = popup;

    // Add click handler to show popup
    map.events.add("click", bubbleLayer, (e: atlas.MapMouseEvent) => {
      if (!e.shapes || e.shapes.length === 0) return;

      const shape = e.shapes[0];
      let properties: Record<string, unknown>;
      let position: atlas.data.Position;

      if (shape instanceof atlas.Shape) {
        properties = shape.getProperties();
        position = shape.getCoordinates() as atlas.data.Position;
      } else {
        const feature = shape as atlas.data.Feature<
          atlas.data.Geometry,
          Record<string, unknown>
        >;
        properties = feature.properties ?? {};
        const point = feature.geometry as atlas.data.Point;
        position = point.coordinates;
      }

      const severity = (properties.severity as string) ?? "unknown";
      const severityColor = getSeverityColor(severity as Severity, isDark);

      popup.setOptions({
        content: `<div style="padding: 10px; max-width: 250px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${severityColor};"></span>
            <strong style="font-size: 14px;">${properties.title ?? "Incident"}</strong>
          </div>
          <p style="margin: 0; font-size: 12px; color: #555;">${properties.description ?? ""}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #888; text-transform: capitalize;">
            ${properties.type ?? ""} &middot; ${severity} severity
          </p>
        </div>`,
        position,
      });

      popup.open(map);
    });

    // Close popup when clicking elsewhere
    map.events.add("click", () => {
      if (popupRef.current?.isOpen()) {
        // Only close if not clicking on a bubble feature
        // The bubbleLayer click handler will handle its own popup
      }
    });

    return () => {
      if (map) {
        try {
          if (popupRef.current) {
            popupRef.current.close();
          }
          if (layerRef.current) {
            map.layers.remove(layerRef.current);
          }
          if (dataSourceRef.current) {
            map.sources.remove(dataSourceRef.current);
          }
        } catch {
          // Map may already be disposed
        }
      }
      dataSourceRef.current = null;
      popupRef.current = null;
      layerRef.current = null;
    };
  }, [map, isDark, colors]);

  // Update incident features when incidents prop changes
  useEffect(() => {
    if (!dataSourceRef.current) return;

    dataSourceRef.current.clear();

    if (incidents.length === 0) return;

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
            roadName: incident.roadName ?? "",
          }
        )
    );

    dataSourceRef.current.add(features);
  }, [incidents]);

  return null;
}
