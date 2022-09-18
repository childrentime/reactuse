import { act, renderHook } from "@testing-library/react";
import useRafState from "../../hooks/useRafState";

describe("useRafState", () => {
  it("should be defined", () => {
    expect(useRafState).toBeDefined();
  });

  it("should work", () => {
    const mockRaf = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    const { result } = renderHook(() => useRafState(0));
    const setRafState = result.current[1];
    expect(result.current[0]).toBe(0);

    act(() => {
      setRafState(1);
    });
    expect(result.current[0]).toBe(1);
    mockRaf.mockRestore();
  });
});
