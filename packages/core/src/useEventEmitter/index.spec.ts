import { act, renderHook } from "@testing-library/react";
import { useEffect, useState } from "react";
import { useEventEmitter } from ".";

describe(useEventEmitter, () => {
  const setUp = () =>
    renderHook(() => {
      const [event, fire] = useEventEmitter<number>();
      const [count, setCount] = useState(0);

      useEffect(() => {
        event((val) => {
          setCount(c => c + val);
        });
        event((val) => {
          setCount(c => c + val + 10);
        });
      }, [event]);

      return {
        event,
        fire,
        count,
      };
    });
  it("should be defined", () => {
    expect(useEventEmitter).toBeDefined();
  });

  it("should fire listeners multiple times", () => {
    const hook = setUp();
    act(() => {
      hook.result.current.fire(1);
    });
    expect(hook.result.current.count).toEqual(12);
    act(() => {
      hook.result.current.fire(2);
    });
    expect(hook.result.current.count).toEqual(26);
  });
});
