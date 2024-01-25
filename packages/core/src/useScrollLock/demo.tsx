import { useScrollLock } from "@reactuses/core";
import type { CSSProperties } from "react";
import { useRef } from "react";

export default () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useScrollLock(elementRef);

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
        <div>Locked: {JSON.stringify(locked)}</div>
        <button
          onClick={() => {
            setLocked(!locked);
          }}
        >
          {locked ? "Unlock" : "Lock"}
        </button>
      </div>
    </div>
  );
};
