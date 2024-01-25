import { useMount, useRafState } from "@reactuses/core";

export default () => {
  const [state, setState] = useRafState({ x: 0, y: 0 });

  useMount(() => {
    const onMouseMove = (event: MouseEvent) => {
      setState({ x: event.clientX, y: event.clientY });
    };
    const onTouchMove = (event: TouchEvent) => {
      setState({
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
    };
  });

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
