import { useRef, useState } from "react";
import useRafFn from "../useRafFn";

export interface UseFpsOptions {
  /**
   * Calculate the FPS on every x frames.
   * @default 10
   */
  every?: number;
}

function useFps(options?: UseFpsOptions): number {
  const [fps, setFps] = useState(0);
  const every = options?.every ?? 10;

  const last = useRef(performance.now());
  const ticks = useRef(0);

  useRafFn(() => {
    ticks.current += 1;
    if (ticks.current >= every) {
      const now = performance.now();
      const diff = now - last.current;
      setFps(Math.round(1000 / (diff / ticks.current)));
      last.current = now;
      ticks.current = 0;
    }
  });

  return fps;
}

// @ts-expect-error un-use
// eslint-disable-next-line unused-imports/no-unused-vars
const useFpsMock = (options?: UseFpsOptions) => 0;

export default typeof performance === "undefined" ? useFpsMock : useFps;
