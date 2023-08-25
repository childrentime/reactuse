import { useHover } from "@reactuses/core";

export default () => {
  const [hoverRef, hovering] = useHover();
  return <div ref={hoverRef}>hovering: {hovering}</div>;
};
