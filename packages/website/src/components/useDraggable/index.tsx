import { useDraggable } from "@reactuses/core";
import { useRef } from "react";
import Layout from "../Layout";
import file from "./README.md";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const el = useRef<HTMLDivElement>(null);

  const innerWidth = typeof window !== "undefined" ? window.innerWidth : 200;
  const [x, y, isDragging] = useDraggable(el, {
    initialValue: { x: innerWidth / 2.2, y: 120 },
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
