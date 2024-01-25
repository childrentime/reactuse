import { renderHook } from "@testing-library/react";
import { createMockMediaMatcher } from "../../.test";
import type { UseDarkOptions } from ".";
import useDarkMode from ".";

describe(useDarkMode, () => {
  const options: UseDarkOptions = {
    classNameDark: "dark",
    classNameLight: "light",
  };
  beforeEach(() => {
    window.matchMedia = createMockMediaMatcher({
      "(prefers-color-scheme: dark)": true,
    }) as any;
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  it("should return true if media query matches", () => {
    const { result } = renderHook(() => useDarkMode(options));
    expect(result.current[0]).toBe(true);
  });

  it("option selector", () => {
    const { result } = renderHook(() =>
      useDarkMode({ selector: "body", ...options }),
    );
    expect(result.current[0]).toBe(true);
    expect(document.body.className).toEqual("dark");
  });

  it("option attribute", () => {
    const { result } = renderHook(() =>
      useDarkMode({ attribute: "className1", ...options }),
    );

    expect(result.current[0]).toBe(true);
    expect(document.querySelector("html")?.getAttribute("className1")).toEqual(
      "dark",
    );
  });

  it("option storageKey", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storageKey: "dark-mode", ...options }),
    );

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem("dark-mode")).toEqual("true");
  });

  it("option storage", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storage: () => sessionStorage, ...options }),
    );

    expect(result.current[0]).toBe(true);
    expect(sessionStorage.getItem("reactuses-color-scheme")).toEqual("true");
  });
});
