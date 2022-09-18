import { renderHook } from "@testing-library/react";
import useMedia from "../../hooks/useMediaQuery";
import { createMockMediaMatcher } from "../utils";

describe("useMedia", () => {
  beforeEach(() => {
    window.matchMedia = createMockMediaMatcher({
      "(min-width: 500px)": true,
      "(min-width: 1000px)": false,
    }) as any;
  });

  it("should return true if media query matches", () => {
    const { result } = renderHook(() => useMedia("(min-width: 500px)"));
    expect(result.current).toBe(true);
  });
  it("should return false if media query does not match", () => {
    const { result } = renderHook(() => useMedia("(min-width: 1200px)"));
    expect(result.current).toBe(false);
  });
  // it("should return default state before hydration", () => {
  //   const { result } = renderHook(() => useMedia("(min-width: 500px)", false), {
  //     hydrate: true,
  //   });
  //   expect(result.current).toBe(false);
  // });
  // it("should return media query result after hydration", async () => {
  //   const { result } = renderHook(() => useMedia("(min-width: 500px)", false), {
  //     hydrate: true,
  //   });
  //   expect(result.current).toBe(true);
  // });
  // it("should return media query result after hydration", async () => {
  //   const { result, hydrate } = renderHookSSR(() =>
  //     useMedia("(min-width: 1200px)", true)
  //   );
  //   expect(result.current).toBe(true);
  //   hydrate();
  //   expect(result.current).toBe(false);
  // });
});
