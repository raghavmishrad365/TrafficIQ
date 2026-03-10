import { useEffect, useState } from "react";
import type { Coordinates } from "../types/map";

interface GeolocationState {
  position: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const isSupported = "geolocation" in navigator;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: isSupported ? null : "Geolocation is not supported by this browser.",
    loading: isSupported,
  });

  useEffect(() => {
    if (!isSupported) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          position: null,
          error: err.message,
          loading: false,
        });
      }
    );
  }, [isSupported]);

  return state;
}
