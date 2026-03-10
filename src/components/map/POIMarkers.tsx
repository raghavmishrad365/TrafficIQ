import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import type { PointOfInterest, POICategory } from "../../types/map";
import { useTheme } from "../../context/ThemeContext";

interface POIMarkersProps {
  map: atlas.Map | null;
  pois: PointOfInterest[];
  onPOIClick?: (poi: PointOfInterest) => void;
}

const CATEGORY_EMOJI: Record<POICategory, string> = {
  gas_station: "\u26FD",
  rest_area: "\uD83D\uDED1",
  truck_stop: "\uD83D\uDE9B",
  repair_shop: "\uD83D\uDD27",
  parking: "\uD83C\uDD7F\uFE0F",
  restaurant: "\uD83C\uDF7D\uFE0F",
  hospital: "\uD83C\uDFE5",
};

export function POIMarkers({ map, pois, onPOIClick }: POIMarkersProps) {
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const popupRef = useRef<atlas.Popup | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!map) return;
    const popup = new atlas.Popup({ closeButton: true, pixelOffset: [0, -16] });
    popupRef.current = popup;
    return () => { try { popup.close(); } catch { /* disposed */ } };
  }, [map]);

  useEffect(() => {
    if (!map || !pois.length) return;

    for (const m of markersRef.current) {
      try { map.markers.remove(m); } catch { /* disposed */ }
    }
    markersRef.current = [];

    const isDark = resolvedTheme === "dark";

    for (const poi of pois) {
      const emoji = CATEGORY_EMOJI[poi.category] ?? "\uD83D\uDCCD";
      const html = `<div style="width:28px;height:28px;border-radius:50%;background:${isDark ? "#2d2d2d" : "#fff"};border:2px solid ${isDark ? "#555" : "#ccc"};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,${isDark ? 0.5 : 0.2});">${emoji}</div>`;

      const marker = new atlas.HtmlMarker({ position: [poi.coordinates.lng, poi.coordinates.lat], htmlContent: html });

      map.events.add("click", marker, () => {
        const distStr = poi.distanceMeters ? `<br/><span style="opacity:0.7">${(poi.distanceMeters / 1000).toFixed(1)} km away</span>` : "";
        const phoneStr = poi.phone ? `<br/><span style="opacity:0.7">${poi.phone}</span>` : "";
        popupRef.current?.setOptions({
          position: [poi.coordinates.lng, poi.coordinates.lat],
          content: `<div style="padding:8px 12px;font-family:sans-serif;font-size:12px"><strong>${poi.name}</strong><br/><span style="opacity:0.8">${poi.address}</span>${phoneStr}${distStr}</div>`,
        });
        popupRef.current?.open(map);
        onPOIClick?.(poi);
      });

      map.markers.add(marker);
      markersRef.current.push(marker);
    }

    return () => {
      for (const m of markersRef.current) {
        try { map.markers.remove(m); } catch { /* disposed */ }
      }
      markersRef.current = [];
    };
  }, [map, pois, onPOIClick, resolvedTheme]);

  return null;
}
