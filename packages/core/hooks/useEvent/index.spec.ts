import type { RenderHookResult } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import useEvent from ".";

const useCount = () => {
  const [count, setCount] = useState(0);

  const addCount = () => {
    setCount(c => c + 1);
  };

  const stableFn = useEvent(() => count);

  return { addCount, stableFn };
};

let hook: RenderHookResult<
  { addCount: () => void; stableFn: () => number },
  unknown
>;

describe("useEvent", () => {
  it("should be defined", () => {
    expect(useEvent).toBeDefined();
  });

  it("should return a function", () => {
    const hook = renderHook(() => useEvent(() => void 0), {
      initialProps: false,
    });

    expect(typeof hook.result.current).toEqual("function");
  });

  it("useEvent should work", () => {
    act(() => {
      hook = renderHook(() => {
        return useCount();
      });
    });

    const currentFn = hook.result.current.stableFn;
    expect(currentFn()).toEqual(0);

    act(() => {
      hook.result.current.addCount();
    });

    expect(currentFn).toEqual(hook.result.current.stableFn);
    expect(hook.result.current.stableFn()).toEqual(1);
  });

  it("should throw error when fn is not a function", () => {
    const errSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => void 0);
    renderHook(() => useEvent(1 as any));
    expect(errSpy).toBeCalledWith(
      "useEvent expected parameter is a function, got number",
    );
    errSpy.mockRestore();
  });
});
