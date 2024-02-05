import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import type { UseLocationSelector } from "./interface";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
}

export const useLocationSelector: UseLocationSelector = <R>(
  selector: (location: Location) => R,
  /**
   * @description server fallback
   * @default undefined
   */
  fallback?: R,
) => {
  return useSyncExternalStore<R | undefined>(
    subscribe,
    () => selector(location),
    () => fallback,
  );
};
