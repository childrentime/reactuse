import useMediaQuery from "../useMediaQuery";

export default function useReducedMotion(defaultState?: boolean) {
  return useMediaQuery("(prefers-reduced-motion: reduce)", defaultState);
}
