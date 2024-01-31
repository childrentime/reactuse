import { useState } from "react";
import useEvent from "../useEvent";
import type { UseCounterType } from "./interface";

export const useCounter: UseCounterType = (
  initialValue: number | (() => number) = 0,
  max: number | null = null,
  min: number | null = null,
) => {
  // avoid exec init code every render
  const initFunc = () => {
    let init
      = typeof initialValue === "function" ? initialValue() : initialValue;

    typeof init !== "number"
      && console.error(
        `initialValue has to be a number, got ${typeof initialValue}`,
      );

    if (typeof min === "number") {
      init = Math.max(init, min);
    }
    else if (min !== null) {
      console.error(`min has to be a number, got ${typeof min}`);
    }

    if (typeof max === "number") {
      init = Math.min(init, max);
    }
    else if (max !== null) {
      console.error(`max has to be a number, got ${typeof max}`);
    }

    return init;
  };

  const [value, setValue] = useState(initFunc);

  const set = useEvent(
    (newState: number | ((prev: number) => number) | (() => number)) => {
      setValue((v) => {
        let nextValue = typeof newState === "function" ? newState(v) : newState;

        if (typeof min === "number") {
          nextValue = Math.max(nextValue, min);
        }
        if (typeof max === "number") {
          nextValue = Math.min(nextValue, max);
        }
        return nextValue;
      });
    },
  );

  const inc = (delta = 1) => {
    set(value => value + delta);
  };

  const dec = (delta = 1) => {
    set(value => value - delta);
  };

  const reset = () => {
    set(initFunc);
  };

  return [value, set, inc, dec, reset] as const;
};
