import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { MutableRefObject } from "react";
import { createRef, useEffect } from "react";
import { act } from "./act";

const mountedMap = new Map<HTMLDivElement, Root>();

const cleanup = () => {
  mountedMap.forEach((root, container) => {
    act(() => {
      root.unmount();
    });
    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  });
  mountedMap.clear();
};

export interface IRenderHookOptions<Props> {
  initialProps?: Props;
}

export interface IRenderHookResult<Props, Result> {
  rerender: (props?: Props) => void;
  result: {
    current: Result;
  };
  unmount: () => void;
}

const renderHook = <Result, Props>(
  renderCallback: (initialProps: Props) => Result,
  options: IRenderHookOptions<Props> = {},
): IRenderHookResult<Props, Result> => {
  const { initialProps } = options;

  const result = createRef<Result>() as MutableRefObject<Result>;
  let root: Root | undefined;
  const container = document.body.appendChild(document.createElement("div"));

  const TestComponent = ({ renderCallbackProps }) => {
    const pendingResult = renderCallback(renderCallbackProps);
    useEffect(() => {
      result.current = pendingResult;
    });
    return null;
  };

  const rerender = (rerenderCallbackProps) => {
    act(() => {
      if (!root) {
        root = createRoot(container);
        mountedMap.set(container, root);
      }
      root.render(
        <TestComponent renderCallbackProps={rerenderCallbackProps} />,
      );
    });
  };

  const unmount = () => {
    act(() => {
      root && root.unmount();
    });
  };

  rerender(initialProps);

  return { rerender, result, unmount };
};

export { renderHook, cleanup };
