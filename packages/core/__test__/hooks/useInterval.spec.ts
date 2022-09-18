import { renderHook } from "@testing-library/react";
import useInterval from "../../hooks/useInterval";

interface ParamsObj {
  fn: (...arg: any) => any;
  delay?: number | null;
  options?: { immediate: boolean };
}
const setUp = ({ fn, delay, options }: ParamsObj) =>
  renderHook(() => useInterval(fn, delay, options));

describe("useInterval", () => {
  jest.useFakeTimers();
  jest.spyOn(global, "clearInterval");
  jest.spyOn(global, "setInterval");

  it("interval should work", () => {
    const callback = jest.fn();
    setUp({ fn: callback, delay: 20 });
    expect(callback).not.toBeCalled();
    jest.advanceTimersByTime(70);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("interval should stop", () => {
    const callback = jest.fn();

    setUp({ fn: callback, delay: null });
    jest.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it("immediate in options should work", () => {
    const options = { immediate: true };
    const callback = jest.fn();
    const { rerender } = setUp({ fn: callback, delay: 20, options: options });
    expect(callback).toBeCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(3);
    options.immediate = false;
    rerender();
    expect(callback).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it("should init hook with default delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useInterval(callback));

    expect(result.current).toBeUndefined();
    expect(setInterval).toHaveBeenCalledTimes(1);
    // if not delay provided, it's assumed as 0
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 0);
  });

  it("should init hook with custom delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useInterval(callback, 5000));

    expect(result.current).toBeUndefined();
    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it("should clear interval on unmount", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 200));
    const initialTimerCount = jest.getTimerCount();
    expect(clearInterval).not.toHaveBeenCalled();

    unmount();

    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(initialTimerCount - 1);
  });

  it("should clear pending interval when delay is updated", () => {
    const callback = jest.fn();
    let delay = 200;
    const { rerender } = renderHook(() => useInterval(callback, delay));
    expect(clearInterval).not.toHaveBeenCalled();
    const initialTimerCount = jest.getTimerCount();

    // update delay while there is a pending interval
    delay = 500;
    rerender();

    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(initialTimerCount);
  });

  it("should handle new interval when delay is updated", () => {
    const callback = jest.fn();
    let delay = 200;
    const { rerender } = renderHook(() => useInterval(callback, delay));
    expect(callback).not.toHaveBeenCalled();

    // fast-forward initial delay
    jest.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);

    // update delay by increasing previous one
    delay = 500;
    rerender();

    // fast-forward initial delay again but this time it should not execute the cb
    jest.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);

    // fast-forward remaining time for new delay
    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
