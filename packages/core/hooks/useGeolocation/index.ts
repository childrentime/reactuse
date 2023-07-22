import { useCallback, useEffect, useState } from "react";
import { defaultOptions } from "../utils/defaults";

const initCoord = {
  accuracy: 0,
  latitude: Infinity,
  longitude: Infinity,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

export default function useGeolocation(options: Partial<PositionOptions> = defaultOptions) {
  const {
    enableHighAccuracy = true,
    maximumAge = 30000,
    timeout = 27000,
  } = options;
  const [coordinates, setCoordinates]
    = useState<GeolocationPosition["coords"]>(initCoord);
  const [locatedAt, setLocatedAt] = useState<number | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setCoordinates(position.coords);
    setLocatedAt(position.timestamp);
    setError(null);
  }, []);

  const updateError = useCallback((err: any) => {
    setCoordinates(initCoord);
    setLocatedAt(null);
    setError(err);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(updatePosition, updateError);
    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      },
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, maximumAge, timeout, updateError, updatePosition]);

  return {
    coordinates,
    locatedAt,
    error,
  } as const;
}
