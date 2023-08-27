import { useHover } from "@reactuses/core";
import { useRef } from "react";

export default () => {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHover(ref);
  return <div ref={ref}> {hovered ? "true" : "false"}</div>;
};
