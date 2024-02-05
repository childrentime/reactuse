import { renderHook } from "@testing-library/react";
import { useSupported } from ".";

describe("useSupported", () => {
  it("should be defined", () => {
    expect(useSupported).toBeDefined();
  });

  it("should support getBattery if mocked", async () => {
    const { result } = renderHook(() =>
      useSupported(() => navigator && "getBattery" in navigator),
    );
    expect(result.current).toBe(false);

    (window.navigator as any).getBattery = jest.fn;

    const { result: result2 } = renderHook(() =>
      useSupported(() => navigator && "getBattery" in navigator),
    );
    expect(result2.current).toBe(true);
  });
});
