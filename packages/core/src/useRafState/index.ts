import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import useUnmount from "../useUnmount";

export const useRafState = <S>(
  initialState: S | (() => S),
): readonly [S, Dispatch<SetStateAction<S>>] => {
  const frame = useRef(0);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback((value: S | ((prevState: S) => S)) => {
    cancelAnimationFrame(frame.current);

    frame.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  useUnmount(() => {
    cancelAnimationFrame(frame.current);
  });

  return [state, setRafState] as const;
};
