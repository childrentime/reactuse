import { useEffect, useState } from "react";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";

export default function useSupported(
  callback: () => unknown,
  sync = false,
): boolean {
  const [supported, setSupported] = useState(false);

  const effect = sync ? useIsomorphicLayoutEffect : useEffect;
  effect(() => {
    setSupported(Boolean(callback()));
  }, []);

  return supported;
}
