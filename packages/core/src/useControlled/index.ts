import { useCallback, useState } from "react";
import { useLatest } from "../useLatest";
import type { UseControlled } from "./interface";

export const useControlled: UseControlled = <T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (v: T, ...args: any[]) => void,
): [T, (value: T) => void] => {
  const [stateValue, setStateValue] = useState(
    value !== undefined ? value : defaultValue,
  );
  const isControlled = value !== undefined;
  const onChangeRef = useLatest(onChange);

  const setValue = useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setStateValue(newValue);
      }
      onChangeRef.current?.(newValue);
    },
    [isControlled, onChangeRef],
  );

  return [isControlled ? value : stateValue, setValue];
};
