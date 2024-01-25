import useMediaQuery from "../useMediaQuery";

export default function usePreferredDark(defaultState?: boolean): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)", defaultState);
}
