import { useMemo, useSyncExternalStore } from "react";

export default function useMediaQuery(
  query: string,
  serverFallback?: boolean
): boolean {
  const getServerSnapshot =
    serverFallback !== undefined ? () => serverFallback : undefined;

  const [getSnapshot, subscribe] = useMemo(() => {
    const mediaQueryList = window.matchMedia(query);

    return [
      () => mediaQueryList.matches,
      (notify: () => void) => {
        try {
          mediaQueryList.addEventListener("change", notify);
        } catch (e) {
          // Safari isn't supporting mediaQueryList.addEventListener
          mediaQueryList.addListener(notify);
        }

        return () => {
          try {
            mediaQueryList.removeEventListener("change", notify);
          } catch (e) {
            // Safari isn't supporting mediaQueryList.removeEventListener
            mediaQueryList.removeListener(notify);
          }
        };
      },
    ];
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
