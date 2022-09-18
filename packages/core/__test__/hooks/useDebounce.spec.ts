import { act, renderHook } from "@testing-library/react";
import useDebounce from "../../hooks/useDebounce";
import { sleep } from "../../utils/testingHelpers";

describe("useDebounce", () => {
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
    expect(useDebounce).toBeDefined();
  });

  it("should have a value to be returned", () => {
    const { result } = renderHook(() => useDebounce(0, 100));
    expect(result.current).toBe(0);
  });

  it("should has same value if time is advanced less than the given time", () => {
    const { result, rerender } = renderHook(
      (props) => useDebounce(props, 100),
      {
        initialProps: 0,
      }
    );
    expect(result.current).toBe(0);
    act(() => {
      rerender(1);
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe(0);
  });

  it("should not update the value after the given time", () => {
    const hook = renderHook((props) => useDebounce(props, 100), {
      initialProps: 0,
    });
    expect(hook.result.current).toBe(0);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(hook.result.current).toBe(0);
  });

  it("should cancel timeout on unmount", () => {
    const hook = renderHook((props) => useDebounce(props, 100), {
      initialProps: 0,
    });
    expect(hook.result.current).toBe(0);
    act(() => {
      hook.rerender(1);
      hook.unmount();
    });
    expect(jest.getTimerCount()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(hook.result.current).toBe(0);
  });

  it("default useDebounce should work", async () => {
    const hook = renderHook((props) => useDebounce(props, 100), {
      initialProps: 0,
    });
    expect(hook.result.current).toEqual(0);
    act(() => {
      hook.rerender(1);
      hook.rerender(2);
    });

    expect(hook.result.current).toEqual(0);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(hook.result.current).toEqual(2);
    act(() => {
      hook.rerender(4);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(hook.result.current).toEqual(4);
  });

  it("useDebounce wait:200ms", async () => {
    jest.useRealTimers();
    let mountedState = 0;
    const { result, rerender } = renderHook(() =>
      useDebounce(mountedState, 200)
    );
    expect(result.current).toEqual(0);

    act(() => {
      mountedState = 1;
      rerender();
    });
    await act(async () => {
      await sleep(50);
    });

    expect(result.current).toEqual(0);

    act(() => {
      mountedState = 2;
      rerender();
    });
    await act(async () => {
      await sleep(100);
    });

    expect(result.current).toEqual(0);

    act(() => {
      mountedState = 3;
      rerender();
    });
    await act(async () => {
      await sleep(150);
    });

    expect(result.current).toEqual(0);

    act(() => {
      mountedState = 4;
      rerender();
    });
    await act(async () => {
      await sleep(250);
    });
    expect(result.current).toEqual(4);
  });
});
