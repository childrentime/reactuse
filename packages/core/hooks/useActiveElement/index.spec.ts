import { act, renderHook, waitFor } from "@testing-library/react";
import useActiveElement from ".";

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

    waitFor(() => {
      expect(result.current).toEqual(input);
    });

    act(() => {
      input.blur();
    });

    waitFor(() => {
      expect(result.current).toEqual(document.body);
    });
  });
});
