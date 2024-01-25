import { useEffect, useLayoutEffect } from "react";
import { isBrowser } from "../utils/is";

const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
