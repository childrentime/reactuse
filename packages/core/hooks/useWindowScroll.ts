import useEventListener from "./useEventListener";
import useIsomorphicLayoutEffect from "./useIsomorphicLayoutEffect";
import useRafState from "./useRafState";

export interface State {
  x: number;
  y: number;
}
export default function useWindowScroll(): State {
  const [state, setState] = useRafState<State>(() => ({
    x: 0,
    y: 0,
  }));

  const handleScroll = () => {
    setState({ x: window.scrollX, y: window.scrollY });
  };

  useEventListener("scroll", handleScroll, window, {
    capture: false,
    passive: true,
  });

  // Set scroll at the first client-side load
  useIsomorphicLayoutEffect(() => {
    handleScroll();
  }, []);

  return state;
}
