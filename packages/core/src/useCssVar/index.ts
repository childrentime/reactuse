import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isBrowser } from "../utils/is";
import { type UseCssVar, type UseCssVarOptions, defaultOptions } from "./interface";

const getInitialState = (defaultValue?: string) => {
  // Prevent a React hydration mismatch when a default value is provided.
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (isBrowser) {
    return "";
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`useCssVar` When server side rendering, defaultValue should be defined to prevent a hydration mismatches.",
    );
  }

  return "";
};

export const useCssVar: UseCssVar = <T extends HTMLElement = HTMLElement>(
  prop: string,
  target: RefObject<T>,
  defaultValue?: string,
  options: UseCssVarOptions = defaultOptions,
) => {
  const { observe } = options;
  const [variable, setVariable] = useState<string>(
    getInitialState(defaultValue),
  );
  const element = target.current;
  const observerRef = useRef<MutationObserver>();

  const set = useCallback(
    (v: string) => {
      if (element?.style) {
        element?.style.setProperty(prop, v);
        setVariable(v);
      }
    },
    [element, prop],
  );

  const updateCssVar = useCallback(() => {
    if (element) {
      const value = window
        .getComputedStyle(element)
        .getPropertyValue(prop)
        ?.trim();
      setVariable(value);
    }
  }, [element, prop]);

  useEffect(() => {
    if (!element) {
      return;
    }
    const value = window
      .getComputedStyle(element)
      .getPropertyValue(prop)
      ?.trim();
    /** if var don't has value and defaultValue exist */
    if (!value && defaultValue) {
      set(defaultValue);
    }
    else {
      updateCssVar();
    }
    if (!observe) {
      return;
    }
    observerRef.current = new MutationObserver(updateCssVar);

    observerRef.current.observe(element, {
      attributeFilter: ["style", "class"],
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observe, element, updateCssVar, set, defaultValue, prop]);

  return [variable, set] as const;
};
