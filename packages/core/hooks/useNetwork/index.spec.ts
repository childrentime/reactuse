import { act, renderHook } from "@testing-library/react";
import useNetwork from ".";

describe("useNetwork", () => {
  it("toggle network state", async () => {
    const mock = jest
      .spyOn(window.navigator, "onLine", "get")
      .mockImplementation(() => true);
    const { result } = renderHook(() => useNetwork());
    expect(result.current.online).toBeTruthy();
    act(() => {
      mock.mockReturnValue(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.online).toBeFalsy();

    act(() => {
      mock.mockReturnValue(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.online).toBeTruthy();
  });
});
