import { useCallback, useRef, useSyncExternalStore } from "react";

export interface WindowSize {
  width: number;
  height: number;
}

interface StateDependencies {
  width?: boolean;
  height?: boolean;
}

const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("resize", callback);
  };
};

export default function useWindowSize() {
  const stateDependencies = useRef<StateDependencies>({}).current;
  const previous = useRef<WindowSize>({
    width: 0,
    height: 0,
  });
  const isEqual = useCallback((prev: WindowSize, current: WindowSize) => {
    for (const _ in stateDependencies) {
      const t = _ as keyof StateDependencies;
      if (current[t] !== prev[t]) {
        return false;
      }
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stateDependencies)]);

  const cached = useSyncExternalStore(
    subscribe,
    () => {
      const data = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      if (!isEqual(previous.current, data)) {
        previous.current = data;
        return data;
      }
      return previous.current;
    },
    () => {
      return previous.current;
    },
  );

  return {
    get width() {
      stateDependencies.width = true;
      return cached.width;
    },
    get height() {
      stateDependencies.height = true;
      return cached.height;
    },
  };
}
