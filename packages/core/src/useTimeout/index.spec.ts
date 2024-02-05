import { act, renderHook } from "@testing-library/react";
import { useTimeout } from ".";

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
  expect(useTimeout).toBeDefined();
});

it("should return type", () => {
  const hook = renderHook(() => useTimeout(5));

  expect(hook.result.current.length).toBe(3);
  expect(typeof hook.result.current[0]).toBe("boolean");
  expect(typeof hook.result.current[1]).toBe("function");
  expect(typeof hook.result.current[2]).toBe("function");
});

function getHook(ms = 5, options = { immediate: false }) {
  const spy = jest.fn();
  return [
    spy,
    renderHook(
      ({ delay = 5, opts = { immediate: false } }) => {
        spy();
        return useTimeout(delay, opts);
      },
      { initialProps: { delay: ms, opts: options } },
    ),
  ] as const;
}

it("should re-render component after given amount of time", () => {
  const [spy] = getHook(5, { immediate: true });
  expect(spy).toHaveBeenCalledTimes(2);
  act(() => {
    jest.advanceTimersByTime(5);
  });
  expect(spy).toHaveBeenCalledTimes(3);
});

it("should cancel timeout on unmount", () => {
  const [spy, hook] = getHook();

  expect(spy).toHaveBeenCalledTimes(1);
  hook.unmount();
  act(() => {
    hook.result.current[1]();
    jest.advanceTimersByTime(5);
  });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(hook.result.current[0]).toEqual(false);
});

it("first function should return actual state of timeout", () => {
  let [, hook] = getHook(5, { immediate: true });
  const [isPending] = hook.result.current;

  expect(isPending).toBe(true);

  hook.unmount();

  expect(hook.result.current[0]).toBe(true);

  [, hook] = getHook();
  act(() => {
    jest.advanceTimersByTime(5);
  });
  expect(hook.result.current[0]).toBe(false);
});

it("second function should cancel timeout", () => {
  const [spy, hook] = getHook(5, { immediate: true });
  const [isPending, , cancel] = hook.result.current;

  expect(spy).toHaveBeenCalledTimes(2);
  expect(isPending).toBe(true);

  act(() => {
    cancel();
    jest.advanceTimersByTime(5);
  });

  expect(spy).toHaveBeenCalledTimes(3);
  expect(hook.result.current[0]).toBe(false);
});

it("first function should start timeout", () => {
  const [spy, hook] = getHook();
  const [isPending, start, cancel] = hook.result.current;

  expect(isPending).toBe(false);

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
  expect(spy).toHaveBeenCalledTimes(3);
  expect(hook.result.current[0]).toBe(false);
});

it("should reset timeout on delay change", () => {
  const [spy, hook] = getHook(15);

  expect(spy).toHaveBeenCalledTimes(1);
  hook.rerender({ delay: 5, opts: { immediate: true } });
  expect(spy).toHaveBeenCalledTimes(3);
  act(() => {
    jest.advanceTimersByTime(5);
  });

  expect(spy).toHaveBeenCalledTimes(4);
});
