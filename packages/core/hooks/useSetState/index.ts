import { useCallback, useState } from "react";

export default function useSetState<T extends Record<string, any>>(initialState: T) {
  const [state, _setState] = useState(initialState);
  const setState = useCallback(
    (statePartial: Partial<T> | ((currentState: T) => Partial<T>)) =>
      _setState(current => ({
        ...current,
        ...(typeof statePartial === "function" ? statePartial(current) : statePartial),
      })),
    [],
  );
  return [state, setState] as const;
}
