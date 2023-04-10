import { renderHook } from "@testing-library/react";
import { createMockRaf } from "../../.test";
import useRafFn from ".";

describe("useRafFn", () => {
  const mockRaf = createMockRaf();
  jest.spyOn(window, "requestAnimationFrame").mockImplementation(mockRaf.raf);
  it("should be defined", () => {
    expect(useRafFn).toBeDefined();
  });

  it("should return object with start, stop and isActive functions", () => {
    const hook = renderHook(() => useRafFn(() => false), {
      initialProps: false,
    });

    expect(hook.result.current).toStrictEqual([
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it("should constantly call callback inside the raf loop", () => {
    const spy = jest.fn();
    renderHook(() => useRafFn(spy));
    expect(spy).not.toBeCalled();

    mockRaf.step(2);
    expect(spy).toBeCalledTimes(2);
    mockRaf.step(2);
    expect(spy).toBeCalledTimes(4);
  });

  it("should not start the loop if 2nd hook parameter is falsy", () => {
    const spy = jest.fn();
    renderHook(() => useRafFn(spy, false), { initialProps: false });

    expect(spy).not.toBeCalled();
    mockRaf.step(2);
    expect(spy).not.toBeCalled();
  });

  it("should pass the time argument to given callback", () => {
    const spy = jest.fn();
    renderHook(() => useRafFn(spy), { initialProps: false });

    expect(spy).not.toBeCalled();
    mockRaf.step();
    expect(typeof spy.mock.calls[0][0]).toBe("number");
  });

  it("should stop the loop on component unmount", () => {
    const spy = jest.fn();
    const hook = renderHook(() => useRafFn(spy), { initialProps: false });

    expect(spy).not.toBeCalled();
    mockRaf.step(2);
    expect(spy).toBeCalledTimes(2);

    hook.unmount();

    mockRaf.step(2);
    expect(spy).toBeCalledTimes(2);
  });

  it("should call the actual callback when it changed", () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const hook = renderHook(({ cb }) => useRafFn(cb), {
      initialProps: { cb: spy1 },
    });

    expect(spy1).not.toBeCalled();
    mockRaf.step(2);
    expect(spy1).toBeCalledTimes(2);

    hook.rerender({ cb: spy2 });

    mockRaf.step(2);
    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(2);
  });

  describe("returned methods", () => {
    it("stop method should stop the loop", () => {
      const spy = jest.fn();
      const hook = renderHook(() => useRafFn(spy), { initialProps: false });

      const [stop] = hook.result.current;

      expect(spy).not.toBeCalled();
      mockRaf.step(2);
      expect(spy).toBeCalledTimes(2);

      stop();

      mockRaf.step(2);
      expect(spy).toBeCalledTimes(2);
    });

    it("start method should start stopped loop", () => {
      const spy = jest.fn();
      const hook = renderHook(() => useRafFn(spy, false), {
        initialProps: false,
      });

      const [stop, start] = hook.result.current;

      expect(spy).not.toBeCalled();
      mockRaf.step(2);
      expect(spy).not.toBeCalled();

      start();

      mockRaf.step(2);
      expect(spy).toBeCalledTimes(2);

      stop();

      mockRaf.step(2);
      expect(spy).toBeCalledTimes(2);

      start();

      mockRaf.step(2);
      expect(spy).toBeCalledTimes(4);
    });

    it("isActive method should return current loop state", () => {
      const spy = jest.fn();
      const hook = renderHook(() => useRafFn(spy, false), {
        initialProps: false,
      });

      const [stop, start, isActive] = hook.result.current;

      expect(isActive()).toBe(false);
      start();
      expect(isActive()).toBe(true);
      stop();
      expect(isActive()).toBe(false);
    });
  });
});
