import { useMediaQuery } from "../useMediaQuery";

export const useReducedMotion = (defaultState?: boolean) => {
  return useMediaQuery("(prefers-reduced-motion: reduce)", defaultState);
};
