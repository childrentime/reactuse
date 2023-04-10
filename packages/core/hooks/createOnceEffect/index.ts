import type { useEffect, useLayoutEffect } from "react";

type EffectHookType = typeof useEffect | typeof useLayoutEffect;

const record = new WeakSet();

const createOnceEffect: (hook: EffectHookType) => EffectHookType
  = hook => (effect, deps) => {
    const onceWrapper = () => {
      const shouldStart = !record.has(effect);
      if (shouldStart) {
        record.add(effect);
        effect();
      }
    };
    hook(() => {
      onceWrapper();
    }, deps);
  };

export default createOnceEffect;
