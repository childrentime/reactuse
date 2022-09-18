import { renderHook } from "@testing-library/react";
import useIsomorphicLayoutEffect from "../../hooks/useIsomorphicLayoutEffect";

describe("useIsomorphicLayoutEffect", () => {
  const callback = jest.fn();
  const { result } = renderHook(() => useIsomorphicLayoutEffect(callback));

  it("cheak return value", () => {
    expect(result.current).toBe(undefined);
  });
});
