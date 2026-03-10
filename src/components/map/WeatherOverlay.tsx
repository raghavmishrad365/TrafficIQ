import { useEffect, useRef } from "react";
import * as atlas from "azure-maps-control";
import { useTheme } from "../../context/ThemeContext";
import type { LocationWeather, WeatherDayForecast } from "../../types/map";

interface WeatherOverlayProps {
  map: atlas.Map | null;
  weatherData: LocationWeather[];
}

function getWeatherEmoji(forecast: WeatherDayForecast): string {
  const phrase = forecast.iconPhrase.toLowerCase();
  if (phrase.includes("thunder") || phrase.includes("storm")) return "\u26C8\uFE0F";
  if (phrase.includes("snow") || phrase.includes("flurr")) return "\u2744\uFE0F";
  if (phrase.includes("rain") || phrase.includes("shower") || phrase.includes("drizzle")) return "\uD83C\uDF27\uFE0F";
  if (phrase.includes("fog") || phrase.includes("haz") || phrase.includes("mist")) return "\uD83C\uDF2B\uFE0F";
  if (phrase.includes("cloud") || phrase.includes("overcast")) return "\u2601\uFE0F";
  if (phrase.includes("partly") || phrase.includes("intermittent")) return "\u26C5";
  if (phrase.includes("sun") || phrase.includes("clear")) return "\u2600\uFE0F";
  return "\uD83C\uDF24\uFE0F";
}

export function WeatherOverlay({ map, weatherData }: WeatherOverlayProps) {
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!map || !weatherData.length) return;

    for (const m of markersRef.current) {
      try { map.markers.remove(m); } catch { /* disposed */ }
    }
    markersRef.current = [];

    const isDark = resolvedTheme === "dark";
    const bg = isDark ? "#2d2d2d" : "#ffffff";
    const fg = isDark ? "#e0e0e0" : "#333333";
    const border = isDark ? "#444" : "#ddd";

    for (const w of weatherData) {
      const forecast = w.current ?? w.forecasts[0];
      if (!forecast) continue;

      const emoji = getWeatherEmoji(forecast);
      const temp = `${forecast.temperatureMax}\u00B0C`;
      const wind = `${forecast.windSpeed} km/h`;

      const html = `<div style="background:${bg};color:${fg};border:1px solid ${border};border-radius:8px;padding:4px 8px;font-size:11px;font-family:sans-serif;box-shadow:0 2px 6px rgba(0,0,0,${isDark ? 0.4 : 0.15});display:flex;flex-direction:column;align-items:center;min-width:80px;pointer-events:none;">
        <div style="font-size:18px;line-height:1">${emoji}</div>
        <div style="font-weight:600;margin-top:2px">${temp}</div>
        <div style="opacity:0.7;font-size:10px">${wind} ${forecast.windDirection}</div>
        <div style="opacity:0.6;font-size:9px;margin-top:1px">${w.locationLabel}</div>
      </div>`;

      const marker = new atlas.HtmlMarker({ position: [w.location.lng, w.location.lat], htmlContent: html, pixelOffset: [0, -20] });
      map.markers.add(marker);
      markersRef.current.push(marker);
    }

    return () => {
      for (const m of markersRef.current) {
        try { map.markers.remove(m); } catch { /* disposed */ }
      }
      markersRef.current = [];
    };
  }, [map, weatherData, resolvedTheme]);

  return null;
}
