import useEventListener from "../useEventListener";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";
import useRafState from "../useRafState";

export interface UseWindowScrollState {
  x: number;
  y: number;
}

const listenerOptions = {
  capture: false,
  passive: true,
};
export default function useWindowScroll(): UseWindowScrollState {
  const [state, setState] = useRafState<UseWindowScrollState>(() => ({
    x: 0,
    y: 0,
  }));

  const handleScroll = () => {
    setState({ x: window.scrollX, y: window.scrollY });
  };

  useEventListener("scroll", handleScroll, window, listenerOptions);

  // Set scroll at the first client-side load
  useIsomorphicLayoutEffect(() => {
    handleScroll();
  }, []);

  return state;
}
