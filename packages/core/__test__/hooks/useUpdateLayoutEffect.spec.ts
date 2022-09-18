import { renderHook } from "@testing-library/react";
import useUpdateLayoutEffect from "../../hooks/useUpdateLayoutEffect";

describe("useUpdateLayoutEffect", () => {
  it("test on mounted", async () => {
    let mountedState = 1;
    const hook = renderHook(() =>
      useUpdateLayoutEffect(() => {
        mountedState = 2;
      })
    );
    expect(mountedState).toEqual(1);
    hook.rerender();
    expect(mountedState).toEqual(2);
  });
  it("test on optional", () => {
    let mountedState = 1;
    const hook = renderHook(() =>
      useUpdateLayoutEffect(() => {
        mountedState = 3;
      }, [mountedState])
    );
    expect(mountedState).toEqual(1);
    hook.rerender();
    expect(mountedState).toEqual(1);
    mountedState = 2;
    hook.rerender();
    expect(mountedState).toEqual(3);
  });

  it("should run effect on update", () => {
    const effect = jest.fn();

    const { rerender } = renderHook(() => useUpdateLayoutEffect(effect));
    expect(effect).not.toHaveBeenCalled();

    rerender();
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("should run cleanup on unmount", () => {
    const cleanup = jest.fn();
    const effect = jest.fn().mockReturnValue(cleanup);
    const hook = renderHook(() => useUpdateLayoutEffect(effect));

    hook.rerender();
    hook.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
