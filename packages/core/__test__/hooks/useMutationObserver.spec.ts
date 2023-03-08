import { renderHook, waitFor } from "@testing-library/react";
import useMutationObserver from "../../hooks/useMutationObserber";

const options: MutationObserverInit = {
  attributes: true,
  childList: true,
  attributeOldValue: true,
};

describe("useMutationObserver", () => {
  let container: HTMLDivElement;
  let container1: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container1 = document.createElement("div");
    document.body.appendChild(container);
    document.body.appendChild(container1);
  });

  afterEach(() => {
    document.body.removeChild(container);
    document.body.removeChild(container1);
  });

  it("should callback work when target style be changed", async () => {
    const callback = jest.fn();
    const { rerender } = renderHook(() =>
      useMutationObserver(callback, () => container, options)
    );
    container.style.backgroundColor = "#000";
    await rerender();
    expect(callback).toBeCalled();
  });

  it("should callback work when target node tree be changed", async () => {
    const callback = jest.fn();
    const { rerender } = renderHook(() =>
      useMutationObserver(callback, () => container, options)
    );
    const paraEl = document.createElement("p");
    container.appendChild(paraEl);
    await rerender();
    expect(callback).toBeCalled();
  });

  it("should not work when target is null", async () => {
    const callback = jest.fn();
    const { rerender } = renderHook(() =>
      useMutationObserver(callback, null, options)
    );
    container.style.backgroundColor = "#000";
    rerender();
    expect(callback).not.toBeCalled();
  });

  it("should work when target changed", async () => {
    const props = {
      container: container,
      callback: jest.fn(),
    };
    const props1 = {
      container: container1,
      callback: jest.fn(),
    };
    const { rerender } = renderHook(
      () => useMutationObserver(props.callback, () => props.container, options),
      {
        initialProps: props,
      }
    );
    container.style.backgroundColor = "#000";
    await rerender();
    expect(props.callback).toBeCalled();
    rerender(props1);
    waitFor(() => {
      expect(props1.callback).not.toBeCalled();
    });

    container1.style.backgroundColor = "#000";
    waitFor(() => {
      expect(props1.callback).toBeCalled();
    });
  });
});
