import { useState } from "react";
import screenfull from "screenfull";
import type { BasicTarget } from "../utils/domTarget";
import { getTargetElement } from "../utils/domTarget";
import useUnmount from "../useUnmount";
import useEvent from "../useEvent";
import { defaultOptions } from "../utils/defaults";

export interface UseFullScreenOptions {
  onExit?: () => void;
  onEnter?: () => void;
}

export default function useFullscreen(
  target: BasicTarget,
  options: UseFullScreenOptions = defaultOptions,
) {
  const { onExit, onEnter } = options;

  const [state, setState] = useState(false);

  const onChange = () => {
    if (screenfull.isEnabled) {
      const { isFullscreen } = screenfull;
      if (isFullscreen) {
        onEnter?.();
      }
      else {
        screenfull.off("change", onChange);
        onExit?.();
      }
      setState(isFullscreen);
    }
  };

  const enterFullscreen = () => {
    const el = getTargetElement(target);
    if (!el) {
      return;
    }

    if (screenfull.isEnabled) {
      try {
        screenfull.request(el);
        screenfull.on("change", onChange);
      }
      catch (error) {
        console.error(error);
      }
    }
  };

  const exitFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.exit();
    }
  };

  const toggleFullscreen = () => {
    if (state) {
      exitFullscreen();
    }
    else {
      enterFullscreen();
    }
  };

  useUnmount(() => {
    if (screenfull.isEnabled) {
      screenfull.off("change", onChange);
    }
  });

  return [
    state,
    {
      enterFullscreen: useEvent(enterFullscreen),
      exitFullscreen: useEvent(exitFullscreen),
      toggleFullscreen: useEvent(toggleFullscreen),
      isEnabled: screenfull.isEnabled,
    },
  ] as const;
}
