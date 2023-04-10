import { renderHook, waitFor } from "@testing-library/react";
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
  it("should return dark if media query matches", () => {
    const { result } = renderHook(() => useDarkMode(options));
    waitFor(() => {
      expect(result.current[0]).toBe("dark");
    });
  });

  it("option selector", () => {
    const { result } = renderHook(() =>
      useDarkMode({ selector: "body", ...options }),
    );
    waitFor(() => {
      expect(result.current[0]).toBe("dark");
      expect(document.body.className).toEqual("dark");
    });
  });

  it("option attribute", () => {
    const { result } = renderHook(() =>
      useDarkMode({ attribute: "className1", ...options }),
    );
    waitFor(() => {
      expect(result.current[0]).toBe("dark");
      expect(
        document.querySelector("html")?.getAttribute("className1"),
      ).toEqual("dark");
    });
  });

  it("option storageKey", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storageKey: "dark-mode", ...options }),
    );
    waitFor(() => {
      expect(result.current[0]).toBe("dark");
      expect(localStorage.getItem("dark-mode")).toEqual("dark");
    });
  });

  it("option storage", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storage: () => sessionStorage, ...options }),
    );
    waitFor(() => {
      expect(result.current[0]).toBe("dark");
      expect(sessionStorage.getItem("reactuses-color-scheme")).toEqual("dark");
    });
  });
});
