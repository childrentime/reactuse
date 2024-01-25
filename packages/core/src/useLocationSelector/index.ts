import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
}

export default function useLocationSelector<R>(
  selector: (location: Location) => R,
  /**
   * @description server fallback
   * @default undefined
   */
  fallback?: R,
) {
  return useSyncExternalStore<R | undefined>(
    subscribe,
    () => selector(location),
    () => fallback,
  );
}
