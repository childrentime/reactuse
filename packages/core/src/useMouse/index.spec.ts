import { act, renderHook } from "@testing-library/react";
import { useMouse } from ".";

describe("useMouse", () => {
  function moveMouse(x: number, y: number) {
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
      }),
    );
  }

  let mockRaf: jest.SpyInstance;
  beforeAll(() => {
    mockRaf = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
  });

  afterAll(() => {
    mockRaf.mockRestore();
  });

  it("on mouseMove", async () => {
    const hook = renderHook(() => useMouse(document.documentElement));
    expect(hook.result.current.pageX).toEqual(Number.NaN);
    expect(hook.result.current.pageY).toEqual(Number.NaN);

    act(() => {
      moveMouse(10, 10);
    });
    expect(hook.result.current.pageY).toEqual(undefined);
    expect(hook.result.current.clientX).toEqual(10);
    expect(hook.result.current.clientY).toEqual(10);
    expect(hook.result.current.screenX).toEqual(10);
    expect(hook.result.current.screenY).toEqual(10);
    expect(hook.result.current.pageX).toEqual(undefined);
  });

  it("should be work with target", async () => {
    const events: Record<string, any> = {};
    const getBoundingClientRectMock = jest.spyOn(
      HTMLElement.prototype,
      "getBoundingClientRect",
    );
    jest.spyOn(document, "addEventListener").mockImplementation(
      jest.fn((event: any, callback: any) => {
        events[event] = callback;
      }),
    );

    const targetEl = document.createElement("div");
    getBoundingClientRectMock.mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
    } as DOMRect);
    const { result } = renderHook(() => useMouse(targetEl));

    act(() => {
      events.mousemove({ pageX: 100, pageY: 100 });
    });

    expect(result.current.elementX).toBe(0);
    expect(result.current.elementY).toBe(0);
    expect(result.current.elementPosX).toBe(100);
    expect(result.current.elementPosY).toBe(100);
  });
});
