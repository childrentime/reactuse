import { act, renderHook } from "@testing-library/react";
import { createMockRaf } from "../../.test";
import { useOrientation } from ".";

describe("useOrientation", () => {
  const mockRaf = createMockRaf();
  jest.spyOn(window, "requestAnimationFrame").mockImplementation(mockRaf.raf);

  beforeEach(() => {
    (window.screen.orientation as object) = {
      type: "landscape-primary",
      angle: 0,
    };
    (window.orientation) = 0;
  });

  it("should be defined", () => {
    expect(useOrientation).toBeDefined();
  });

  function getHook(...args: any[]) {
    return renderHook(() => useOrientation(...args));
  }

  function triggerOrientation(type: string, angle: number) {
    (window.screen.orientation.type as string) = type;
    // @ts-expect-error test
    (window.screen.orientation.angle) = angle;

    window.dispatchEvent(new Event("orientationchange"));
  }

  it("should return current window orientation", () => {
    const hook = getHook();

    expect(typeof hook.result.current[0]).toBe("object");
    expect(typeof hook.result.current[0].type).toBe("string");
    expect(typeof hook.result.current[0].angle).toBe("number");
  });

  it("should use initial values in case of no parameters", () => {
    const hook = getHook();

    expect(hook.result.current[0].type).toBe("landscape-primary");
    expect(hook.result.current[0].angle).toBe(0);
  });

  it("should re-render after orientation change on closest RAF", () => {
    const hook = getHook();

    act(() => {
      triggerOrientation("portrait-secondary", 180);
      mockRaf.step();
    });

    expect(hook.result.current[0].type).toBe("portrait-secondary");
    expect(hook.result.current[0].angle).toBe(180);
  });

  it("should return window.orientation number if window.screen.orientation is missing", () => {
    (window.screen.orientation as unknown) = undefined;

    const hook = getHook();

    expect(hook.result.current[0].type).toBe(void 0);
    expect(hook.result.current[0].angle).toBe(0);
  });

  it("should return 0 if window.orientation is not a number and if window.screen.orientation is missing", () => {
    (window.screen.orientation as unknown) = undefined;
    (window.orientation as unknown) = null;

    const hook = getHook();

    expect(hook.result.current[0].type).toBe(void 0);
    expect(hook.result.current[0].angle).toBe(0);
  });
});
