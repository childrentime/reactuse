# useScroll

React Sensor Hook that tracks scroll position and state

## Usage

>>> show code

```tsx
import { useScroll } from "@reactuses/core";
import { CSSProperties, useMemo, useRef } from "react";

const Demo = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [x, y, isScrolling, arrivedState, directions] = useScroll(elementRef);
  const { left, right, top, bottom } = useMemo(
    () => arrivedState,
    [arrivedState]
  );
  const {
    left: toLeft,
    right: toRight,
    top: toTop,
    bottom: toBottom,
  } = useMemo(() => directions, [directions]);

  const absoluteStyle: CSSProperties = {
    paddingTop: "0.25rem",
    paddingBottom: "0.25rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
    position: "absolute",
  };
  return (
    <div style={{ display: "flex" }}>
      <div
        ref={elementRef}
        style={{
          width: 300,
          height: 300,
          margin: "auto",
          borderRadius: "0.25rem",
          overflow: "scroll",
        }}
      >
        <div style={{ width: 500, height: 400, position: "relative" }}>
          <div
            style={{
              ...absoluteStyle,
              top: "0rem",
              left: "0rem",
            }}
          >
            TopLeft
          </div>
          <div
            style={{
              ...absoluteStyle,
              bottom: "0rem",
              left: "0rem",
            }}
          >
            BottomLeft
          </div>
          <div
            style={{
              ...absoluteStyle,
              top: "0rem",
              right: "0rem",
            }}
          >
            TopRight
          </div>
          <div
            style={{
              ...absoluteStyle,
              bottom: "0rem",
              right: "0rem",
            }}
          >
            BottomRight
          </div>
          <div
            style={{
              ...absoluteStyle,
              top: "33.33333%",
              left: "33.33333%",
            }}
          >
            Scroll Me
          </div>
        </div>
      </div>
      <div
        style={{
          width: 280,
          margin: "auto",
          paddingLeft: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div>
          Position: {x.toFixed(1)}, {y.toFixed(1)}
        </div>
        <div>isScrolling: {JSON.stringify(isScrolling)}</div>
        <div>Top Arrived: {JSON.stringify(top)}</div>
        <div>Right Arrived: {JSON.stringify(right)}</div>
        <div>Bottom Arrived: {JSON.stringify(bottom)}</div>
        <div>Left Arrived: {JSON.stringify(left)}</div>
        <div>Scrolling Up: {JSON.stringify(toTop)}</div>
        <div>Scrolling Right: {JSON.stringify(toRight)}</div>
        <div>Scrolling Down: {JSON.stringify(toBottom)}</div>
        <div>Scrolling Left: {JSON.stringify(toLeft)}</div>
      </div>
    </div>
  );
};
```

>>>

## Type Declarations

>>> Show Type Declarations

```ts
export interface UseScrollOptions {
  /**
   * Throttle time for scroll event, it’s disabled by default.
   *
   * @default 0
   */
  throttle?: number;

  /**
   * The check time when scrolling ends.
   * This configuration will be setting to (throttle + idle) when the `throttle` is configured.
   *
   * @default 200
   */
  idle?: number;

  /**
   * Offset arrived states by x pixels
   *
   */
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };

  /**
   * Trigger it when scrolling.
   *
   */
  onScroll?: (e: Event) => void;

  /**
   * Trigger it when scrolling ends.
   *
   */
  onStop?: (e: Event) => void;

  /**
   * Listener options for scroll event.
   *
   * @default {capture: false, passive: true}
   */
  eventListenerOptions?: boolean | AddEventListenerOptions;
}

export default function useScroll(
  target: BasicTarget<HTMLElement | SVGElement | Window | Document>,
  options: UseScrollOptions = {}
): readonly [
  number,
  number,
  boolean,
  {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  },
  {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  }
];
```

>>>

## Examples
