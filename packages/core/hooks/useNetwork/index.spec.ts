import { act, renderHook, waitFor } from "@testing-library/react";
import useNetwork from ".";

describe("useNetwork", () => {
  it("toggle network state", () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.online).toBeTruthy();
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    waitFor(() => {
      expect(result.current.online).toBeFalsy();
    });
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    waitFor(() => {
      expect(result.current.online).toBeTruthy();
    });
  });
});
