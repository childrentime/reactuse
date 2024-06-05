import { useState, useCallback } from "react";
import { UseControlled } from "./interface";

export const useControlled: UseControlled = <T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (v: T, ...args: any[]) => void
): [T, (value: T) => void] => {
  const [stateValue, setStateValue] = useState(
    value !== undefined ? value : defaultValue
  );
  const isControlled = value !== undefined;

  const setValue = useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setStateValue(newValue);
      }
      if (onChange) {
        onChange(newValue);
      }
    },
    [isControlled, onChange]
  );

  return [isControlled ? value : stateValue, setValue];
};
