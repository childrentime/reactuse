import { act, renderHook } from "@testing-library/react";
import useTimeoutFn, { UseTimeoutFnOptions } from "../../hooks/useTimeoutFn";
import { Fn } from "../../hooks/utils/types";

describe("useTimeoutFn", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should be defined", () => {
    expect(useTimeoutFn).toBeDefined();
  });

  it("should return type", () => {
    const hook = renderHook(() => useTimeoutFn(() => void 0, 5));

    expect(hook.result.current.length).toBe(3);
    expect(typeof hook.result.current[0]).toBe("boolean");
    expect(typeof hook.result.current[1]).toBe("function");
    expect(typeof hook.result.current[2]).toBe("function");
  });

  function getHook(
    ms = 5,
    fn: Fn = jest.fn(),
    options: UseTimeoutFnOptions = { immediate: true }
  ) {
    return [
      fn,
      renderHook(({ delay = 5, cb, opt }) => useTimeoutFn(cb, delay, opt), {
        initialProps: { delay: ms, cb: fn, opt: options },
      }),
    ] as const;
  }

  it("should call passed function after given amount of time", () => {
    const [spy] = getHook();

    expect(spy).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5);
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should cancel function call on unmount", () => {
    const [spy, hook] = getHook();

    expect(spy).not.toHaveBeenCalled();
    expect(hook.result.current[0]).toEqual(true);
    hook.unmount();
    act(() => {
      jest.advanceTimersByTime(5);
    });
    expect(spy).not.toHaveBeenCalled();
    expect(hook.result.current[0]).toEqual(true);
  });

  it("should not call function if not immediate", () => {
    const [spy] = getHook(200, jest.fn(), { immediate: false });
    expect(spy).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should update state after timeout", () => {
    const [, hook] = getHook();
    const [isPending] = hook.result.current;
    expect(isPending).toBe(true);
    act(() => {
      jest.advanceTimersByTime(5);
    });
    expect(hook.result.current[0]).toBe(false);
  });

  it("second function should cancel timeout", () => {
    const [spy, hook] = getHook();
    const [isPending, , cancel] = hook.result.current;

    expect(spy).not.toHaveBeenCalled();
    expect(isPending).toBe(true);

    act(() => {
      cancel();
    });
    act(() => {
      jest.advanceTimersByTime(5);
    });

    expect(spy).not.toHaveBeenCalled();
    expect(hook.result.current[0]).toBe(false);
  });

  it("first function should restart timeout", () => {
    const [spy, hook] = getHook();
    const [isPending, start, cancel] = hook.result.current;

    expect(isPending).toBe(true);

    act(() => {
      cancel();
      jest.advanceTimersByTime(5);
    });

    expect(hook.result.current[0]).toBe(false);

    act(() => {
      start();
    });
    expect(hook.result.current[0]).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(hook.result.current[0]).toBe(false);
  });

  it("should restart timeout on delay change", () => {
    const [spy, hook] = getHook(50);

    expect(spy).not.toHaveBeenCalled();
    hook.rerender({ delay: 5, cb: spy, opt: { immediate: true } });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should NOT reset timeout on function change", () => {
    const [spy, hook] = getHook(50);

    act(() => {
      jest.advanceTimersByTime(25);
    });
    expect(spy).not.toHaveBeenCalled();

    const spy2 = jest.fn();
    hook.rerender({ delay: 50, cb: spy2, opt: { immediate: true } });

    act(() => {
      jest.advanceTimersByTime(25);
    });
    expect(spy).not.toHaveBeenCalled();
    expect(spy2).toHaveBeenCalledTimes(1);
  });
});
