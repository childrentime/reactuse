import { useState, useRef, useEffect } from "react";

export default function useHover() {
  const [hovering, setHovering] = useState(false);

  const ref = useRef<null | HTMLElement>(null);

  const handleMouseOver = () => setHovering(true);
  const handleMouseOut = () => setHovering(false);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener("mouseover", handleMouseOver);
      node.addEventListener("mouseout", handleMouseOut);
    }
  });

  return [ref, hovering];
}
