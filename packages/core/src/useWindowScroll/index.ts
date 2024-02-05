import { useEventListener } from "../useEventListener";
import { useIsomorphicLayoutEffect } from "../useIsomorphicLayoutEffect";
import { useRafState } from "../useRafState";
import type { UseWindowScrollState } from "./interface";

const listenerOptions = {
  capture: false,
  passive: true,
};

export const useWindowScroll = (): UseWindowScrollState => {
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
};
