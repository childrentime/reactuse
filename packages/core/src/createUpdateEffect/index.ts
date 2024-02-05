import type { useEffect, useLayoutEffect } from "react";
import { useFirstMountState } from "../useFirstMountState";

type EffectHookType = typeof useEffect | typeof useLayoutEffect;

const createUpdateEffect: (hook: EffectHookType) => EffectHookType
  = hook => (effect, deps) => {
    const isFirstMount = useFirstMountState();

    hook(() => {
      if (!isFirstMount) {
        return effect();
      }
    }, deps);
  };

export default createUpdateEffect;
