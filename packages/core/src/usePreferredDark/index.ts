import { useMediaQuery } from "../useMediaQuery";

export const usePreferredDark = (defaultState?: boolean): boolean => {
  return useMediaQuery("(prefers-color-scheme: dark)", defaultState);
};
