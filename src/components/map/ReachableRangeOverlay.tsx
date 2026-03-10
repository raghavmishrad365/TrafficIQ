import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { ReachableRange } from "../../types/map";

interface ReachableRangeOverlayProps {
  map: atlas.Map | null;
  ranges: ReachableRange[];
}

export function ReachableRangeOverlay({ map, ranges }: ReachableRangeOverlayProps) {
  const dsRef = useRef<atlas.source.DataSource | null>(null);

  useEffect(() => {
    if (!map) return;
    const ds = new atlas.source.DataSource();
    map.sources.add(ds);
    dsRef.current = ds;

    const polygonLayer = new atlas.layer.PolygonLayer(ds, undefined, {
      fillColor: ["case", ["==", ["get", "travelMode"], "truck"], "rgba(202, 80, 16, 0.15)", "rgba(0, 120, 212, 0.15)"],
      fillOpacity: 1,
    });

    const lineLayer = new atlas.layer.LineLayer(ds, undefined, {
      strokeColor: ["case", ["==", ["get", "travelMode"], "truck"], "#CA5010", "#0078D4"],
      strokeWidth: 2,
      strokeDashArray: [4, 4],
    });

    map.layers.add(polygonLayer);
    map.layers.add(lineLayer);

    return () => {
      try { map.sources.remove(ds); map.layers.remove(polygonLayer); map.layers.remove(lineLayer); } catch { /* disposed */ }
    };
  }, [map]);

  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;
    ds.clear();
    if (!ranges.length) return;

    const allPositions: atlas.data.Position[] = [];

    for (const range of ranges) {
      const ring = range.boundary.map<atlas.data.Position>((c) => [c.lng, c.lat]);
      if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
        ring.push(ring[0]);
      }
      allPositions.push(...ring);
      ds.add(new atlas.data.Feature(new atlas.data.Polygon([ring]), { travelMode: range.travelMode }));
    }

    if (allPositions.length > 0) {
      try {
        const bbox = atlas.data.BoundingBox.fromPositions(allPositions);
        map?.setCamera({ bounds: bbox, padding: 50 });
      } catch { /* ignore */ }
    }
  }, [map, ranges]);

  return null;
}
