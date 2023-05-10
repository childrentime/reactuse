# useGeolocation

React Sensor Hooks that tracks [Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

It allows the user to provide their location to web applications if they so desire. For privacy reasons, the user is asked for permission to report location information.

## Usage

```tsx
import { useGeolocation } from "@reactuses/core";

const Demo = () => {
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
          2
        )}
      </pre>
    </div>
  );
};
```
