import { act, renderHook } from "@testing-library/react";
import { useActiveElement } from ".";

describe("useActiveElement", () => {
  let input: HTMLInputElement;
  beforeEach(() => {
    input = document.createElement("input");
    document.body.appendChild(input);
  });

  afterEach(() => {
    document.body.removeChild(input);
  });

  it("test focus/blur element", () => {
    const { result } = renderHook(() => useActiveElement());
    expect(result.current).toBe(null);

    act(() => {
      input.focus();
    });
    expect(result.current).toEqual(input);

    act(() => {
      input.blur();
    });
    expect(result.current).toEqual(document.body);
  });
});
