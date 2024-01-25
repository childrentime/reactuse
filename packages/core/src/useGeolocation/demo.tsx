import { useGeolocation } from "@reactuses/core";

export default () => {
  const { coordinates, locatedAt, error } = useGeolocation();

  return (
    <div>
      <pre lang="json">
        {JSON.stringify(
          {
            coordinates: {
              accuracy: coordinates.accuracy,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              altitude: coordinates.altitude,
              altitudeAccuracy: coordinates.altitudeAccuracy,
              heading: coordinates.heading,
              speed: coordinates.speed,
            },
            locatedAt,
            error: error ? error.message : error,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
};
