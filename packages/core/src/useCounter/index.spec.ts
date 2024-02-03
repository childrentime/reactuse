import { act, renderHook } from "@testing-library/react";
import { useCounter } from "@reactuses/core";

const setUp = (init?: number, max?: number, min?: number) =>
  renderHook(() => useCounter(init, max, min));

it("should init counter", () => {
  const { result } = setUp(100);
  const [current] = result.current;
  expect(current).toEqual(100);
});

it("should max, min, actions work", () => {
  const { result } = setUp(100, 10, 1);
  const [current, set, inc, dec, reset] = result.current;
  expect(current).toEqual(10);
  act(() => {
    inc(1);
  });
  expect(result.current[0]).toEqual(10);
  act(() => {
    dec(100);
  });
  expect(result.current[0]).toEqual(1);
  act(() => {
    inc();
  });
  expect(result.current[0]).toEqual(2);
  act(() => {
    reset();
  });
  expect(result.current[0]).toEqual(10);
  act(() => {
    set(-1000);
  });
  expect(result.current[0]).toEqual(1);
  act(() => {
    set(c => c + 2);
  });
  expect(result.current[0]).toEqual(3);

  act(() => {
    inc();
    inc();
    inc();
  });
  expect(result.current[0]).toEqual(6);
});
