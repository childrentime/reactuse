import { renderHook, waitFor } from "@testing-library/react";
import useSupported from ".";

describe("useSupported", () => {
  it("should be defined", () => {
    expect(useSupported).toBeDefined();
  });

  it("should support getBattery if mocked", () => {
    const { result, rerender } = renderHook(() => useSupported(() => navigator && "getBattery" in navigator));
    waitFor(() => {
      expect(result.current).toBe(false);
    });
    (window.navigator as any).getBattery = jest.fn;
    rerender();
    waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
