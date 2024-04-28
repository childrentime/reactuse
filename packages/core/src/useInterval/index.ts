import { useEffect, useRef } from "react";
import { useEvent } from "../useEvent";
import { useLatest } from "../useLatest";
import { defaultOptions } from "../utils/defaults";
import type { UseInterval } from "./interface";

export const useInterval: UseInterval = (
  callback: () => void,
  delay?: number | null,
  options: {
    immediate?: boolean;
    controls?: boolean;
  } = defaultOptions
) => {
  const { immediate, controls } = options;
  const savedCallback = useLatest(callback);
  const isActive = useRef<boolean>(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clean = () => {
    timer.current && clearInterval(timer.current);
  }

  const resume = useEvent(() => {
    isActive.current = true;
    timer.current = setInterval(() => savedCallback.current(), delay || 0);
  });

  const pause = useEvent(() => {
    isActive.current = false;
    clean();
  });

  useEffect(() => {
    if (immediate) {
      savedCallback.current();
    }
    if(controls){
      return;
    }
    if (delay !== null) {
      resume();
      return () => {
        clean();
      }
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, immediate]);

  return {
    isActive,
    pause,
    resume
  }
};
