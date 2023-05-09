import { useDraggable } from "@reactuses/core";
import { useEffect, useRef, useState } from "react";

export default () => {
  const el = useRef<HTMLDivElement>(null);

  const [initialValue, setInitialValue] = useState({ x: 200 / 2.2, y: 120 });

  useEffect(() => {
    setInitialValue({ x: window.innerWidth / 2.2, y: 120 });
  }, []);

  const [x, y, isDragging] = useDraggable(el, {
    initialValue,
    preventDefault: true,
  });

  return (
    <div>
      <p style={{ textAlign: "center" }}>Check the floating boxes</p>
      <div
        ref={el}
        style={{
          position: "fixed",
          cursor: "move",
          zIndex: 10,
          touchAction: "none",
          padding: 10,
          border: "solid 1px",
          left: x,
          top: y,
        }}
      >
        {isDragging ? "Dragging!" : "👋 Drag me!"}
        <div>
          I am at {Math.round(x)}, {Math.round(y)}
        </div>
      </div>
    </div>
  );
};
