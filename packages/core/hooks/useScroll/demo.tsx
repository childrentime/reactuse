import { useScroll } from "@reactuses/core";
import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";

export default () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [x, y, isScrolling, arrivedState, directions] = useScroll(elementRef);
  const { left, right, top, bottom } = useMemo(
    () => arrivedState,
    [arrivedState],
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
