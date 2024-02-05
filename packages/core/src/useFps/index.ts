import { useRef, useState } from "react";
import { useRafFn } from "../useRafFn";
import { defaultOptions } from "../utils/defaults";
import type { UseFpsOptions } from "./interface";

export const useFps = (options: UseFpsOptions = defaultOptions): number => {
  const [fps, setFps] = useState(0);
  const every = options.every ?? 10;

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
};
