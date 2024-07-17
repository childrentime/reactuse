import { renderHook } from "@testing-library/react";
import { initCoord, useGeolocation } from ".";

describe("useGeolocation", () => {
  it("should return initCoord when geolocation is not supported", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.coordinates).toEqual(initCoord);
  });

  it("should return coordinates when geolocation is supported", () => {
    // @ts-ignore
    window.navigator.geolocation = {
      getCurrentPosition: (success, error) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });
      },
      watchPosition: () => 1,
      clearWatch: () => {},
    };
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.coordinates).toEqual({
      latitude: 40.7128,
      longitude: -74.006,
    });
  });
});
