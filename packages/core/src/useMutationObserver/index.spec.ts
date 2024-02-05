import { renderHook, waitFor } from "@testing-library/react";
import { useMutationObserver } from ".";

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
    renderHook(() => useMutationObserver(callback, () => container, options));
    container.style.backgroundColor = "#000";

    await waitFor(() => {
      expect(callback).toBeCalled();
    });
  });

  it("should callback work when target node tree be changed", async () => {
    const callback = jest.fn();
    renderHook(() => useMutationObserver(callback, () => container, options));
    const paraEl = document.createElement("p");
    container.appendChild(paraEl);

    await waitFor(() => {
      expect(callback).toBeCalled();
    });
  });

  it("should not work when target is null", async () => {
    const callback = jest.fn();
    renderHook(() => useMutationObserver(callback, null, options));
    container.style.backgroundColor = "#000";

    await waitFor(() => {
      expect(callback).not.toBeCalled();
    });
  });

  it("should work when target changed", async () => {
    const props = {
      container,
      callback: jest.fn(),
    };
    renderHook(
      () => useMutationObserver(props.callback, () => props.container, options),
      {
        initialProps: props,
      },
    );
    container.style.backgroundColor = "#000";

    await waitFor(() => {
      expect(props.callback).toBeCalled();
    });
  });
});
