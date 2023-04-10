import { isEqual } from "lodash";
import type { DependencyList, EffectCallback } from "react";
import useCustomCompareEffect from "../useCustomCompareEffect";

const isPrimitive = (val: any) => val !== Object(val);

export default function useDeepCompareEffect(
  effect: EffectCallback,
  deps: DependencyList,
): void {
  if (process.env.NODE_ENV !== "production") {
    if (!(Array.isArray(deps)) || !deps.length) {
      console.warn(
        "`useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.",
      );
    }

    if (deps.every(isPrimitive)) {
      console.warn(
        "`useDeepCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.",
      );
    }
  }

  useCustomCompareEffect(effect, deps, isEqual);
}
