import { useEffect, useState } from "react";
import { off, on } from "./utils/browser";
import { isBrowser } from "./utils/is";

export interface OrientationState {
  angle: number;
  type: string;
}

const defaultState: OrientationState = {
  angle: 0,
  type: "landscape-primary",
};

export default function useOrientation(
  initialState: OrientationState = defaultState,
) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const screen = window.screen;
    let mounted = true;

    const onChange = () => {
      if (mounted) {
        const { orientation } = screen;

        if (orientation) {
          const { angle, type } = orientation;
          setState({ angle, type });
        }
        else if (window.orientation !== undefined) {
          setState({
            angle:
              typeof window.orientation === "number" ? window.orientation : 0,
            type: "",
          });
        }
      }
    };

    on(window, "orientationchange", onChange);
    onChange();

    return () => {
      mounted = false;
      off(window, "orientationchange", onChange);
    };
  }, []);

  const lockOrientation = (type: OrientationLockType) => {
    if (isBrowser) {
      return;
    }
    if (!(window && "screen" in window && "orientation" in window.screen)) {
      return Promise.reject(new Error("Not supported"));
    }

    return window.screen.orientation.lock(type);
  };

  const unlockOrientation = () => {
    if (isBrowser) {
      return;
    }
    if (!(window && "screen" in window && "orientation" in window.screen)) {
      return;
    }

    return window.screen.orientation.unlock();
  };

  return [state, lockOrientation, unlockOrientation] as const;
}
