import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import { makeStyles, tokens } from "@fluentui/react-components";
import type { TruckRouteComparison } from "../../types/map";

interface TruckRouteLayerProps {
  map: atlas.Map | null;
  comparison: TruckRouteComparison | null;
}

const useStyles = makeStyles({
  legend: {
    position: "absolute" as const,
    bottom: tokens.spacingVerticalM,
    left: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    fontSize: "12px",
    zIndex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: tokens.spacingVerticalXS,
    fontFamily: "sans-serif",
  },
  row: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS },
  carLine: { width: "24px", height: "3px", backgroundColor: "#0078D4", borderRadius: "2px" },
  truckLine: { width: "24px", height: "3px", backgroundImage: "repeating-linear-gradient(90deg, #CA5010 0, #CA5010 6px, transparent 6px, transparent 10px)", borderRadius: "2px" },
  diff: { marginTop: tokens.spacingVerticalXXS, color: tokens.colorNeutralForeground3, fontSize: "11px" },
});

export function TruckRouteLayer({ map, comparison }: TruckRouteLayerProps) {
  const styles = useStyles();
  const carDsRef = useRef<atlas.source.DataSource | null>(null);
  const truckDsRef = useRef<atlas.source.DataSource | null>(null);

  useEffect(() => {
    if (!map) return;
    const carDs = new atlas.source.DataSource();
    const truckDs = new atlas.source.DataSource();
    map.sources.add(carDs);
    map.sources.add(truckDs);
    carDsRef.current = carDs;
    truckDsRef.current = truckDs;

    const carLayer = new atlas.layer.LineLayer(carDs, undefined, { strokeColor: "#0078D4", strokeWidth: 5, strokeOpacity: 0.85 });
    const truckLayer = new atlas.layer.LineLayer(truckDs, undefined, { strokeColor: "#CA5010", strokeWidth: 5, strokeOpacity: 0.85, strokeDashArray: [2, 2] });

    map.layers.add(carLayer);
    map.layers.add(truckLayer);

    return () => {
      try { map.sources.remove(carDs); map.sources.remove(truckDs); map.layers.remove(carLayer); map.layers.remove(truckLayer); } catch { /* disposed */ }
    };
  }, [map]);

  useEffect(() => {
    const carDs = carDsRef.current;
    const truckDs = truckDsRef.current;
    if (!carDs || !truckDs) return;
    carDs.clear();
    truckDs.clear();
    if (!comparison) return;

    carDs.add(new atlas.data.Feature(new atlas.data.LineString(comparison.carRoute.coordinates), { travelMode: "car" }));
    truckDs.add(new atlas.data.Feature(new atlas.data.LineString(comparison.truckRoute.coordinates), { travelMode: "truck" }));

    try {
      const allCoords = [...comparison.carRoute.coordinates, ...comparison.truckRoute.coordinates];
      const bbox = atlas.data.BoundingBox.fromPositions(allCoords);
      map?.setCamera({ bounds: bbox, padding: 60 });
    } catch { /* ignore */ }
  }, [map, comparison]);

  if (!comparison) return null;

  return (
    <div className={styles.legend}>
      <div className={styles.row}>
        <div className={styles.carLine} />
        <span>Car: {comparison.carRoute.durationMinutes} min, {comparison.carRoute.distanceKm} km</span>
      </div>
      <div className={styles.row}>
        <div className={styles.truckLine} />
        <span>Truck: {comparison.truckRoute.durationMinutes} min, {comparison.truckRoute.distanceKm} km</span>
      </div>
      <div className={styles.diff}>
        +{comparison.timeDifferenceMinutes} min, +{comparison.distanceDifferenceKm} km for truck
      </div>
      {comparison.restrictions.length > 0 && (
        <div className={styles.diff}>Restrictions: {comparison.restrictions.join(", ")}</div>
      )}
    </div>
  );
}
