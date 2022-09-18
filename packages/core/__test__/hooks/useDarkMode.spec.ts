import { act, renderHook } from "@testing-library/react";
import useDarkMode from "../../hooks/useDarkMode";
import { createMockMediaMatcher } from "../utils";

describe(useDarkMode, () => {
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
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe("dark");
  });

  it("correctly updates darkmode", () => {
    const { result, rerender } = renderHook(() => useDarkMode());
    const [state, setState] = result.current;
    expect(state).toBe("dark");
    act(() => setState("green"));
    rerender();
    expect(result.current[0]).toEqual("green");
    expect(localStorage.getItem("reactuses-color-scheme")).toEqual("green");
    expect(document.querySelector("html")?.className).toEqual("green");
  });

  it("option selector", () => {
    const { result } = renderHook(() => useDarkMode({ selector: "body" }));
    expect(result.current[0]).toBe("dark");
    expect(document.body.className).toEqual("dark");
  });

  it("option attribute", () => {
    const { result } = renderHook(() =>
      useDarkMode({ attribute: "className1" })
    );
    expect(result.current[0]).toBe("dark");
    expect(document.querySelector("html")?.getAttribute("className1")).toEqual(
      "dark"
    );
  });

  it("option initialValue", () => {
    const { result } = renderHook(() => useDarkMode({ initialValue: "light" }));
    expect(result.current[0]).toBe("light");
    expect(document.querySelector("html")?.className).toEqual("light");
    expect(localStorage.getItem("reactuses-color-scheme")).toEqual("light");
  });

  it("option storageKey", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storageKey: "dark-mode" })
    );
    expect(result.current[0]).toBe("dark");
    expect(localStorage.getItem("dark-mode")).toEqual("dark");
  });

  it("option storage", () => {
    const { result } = renderHook(() =>
      useDarkMode({ storage: () => sessionStorage })
    );
    expect(result.current[0]).toBe("dark");
    expect(sessionStorage.getItem("reactuses-color-scheme")).toEqual("dark");
  });
});
