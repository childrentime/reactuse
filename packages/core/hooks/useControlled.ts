import { useCallback, useEffect, useRef, useState } from "react";

interface IProps<T> {
  controlled?: T;
  defaultValue?: T;
  state?: T;
}

export default function useControlled<T = string>(props?: IProps<T>): readonly [T, (newValue: T) => void] {
  const { controlled, defaultValue: defaultProp, state } = props ?? {
    controlled: undefined,
    defaultValue: undefined,
    state: "value" as T,
  };
  const { current: isControlled } = useRef(controlled !== undefined);
  const [valueState, setValue] = useState(defaultProp);
  const value = (isControlled ? controlled : valueState) as T;

  useEffect(() => {
    if (isControlled !== (controlled !== undefined)) {
      console.error(
        [
          `A component is changing the ${
            isControlled ? "" : "un"
          }controlled ${state} state of ${name} to be ${
            isControlled ? "un" : ""
          }controlled.`,
          "Elements should not switch from uncontrolled to controlled (or vice versa).",
          `Decide between using a controlled or uncontrolled ${name} `
            + "element for the lifetime of the component.",
          "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
          "More info: https://fb.me/react-controlled-components",
        ].join("\n"),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, controlled]);

  const setValueIfUncontrolled = useCallback((newValue: T) => {
    if (!isControlled) {
      setValue(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValueIfUncontrolled] as const;
}
