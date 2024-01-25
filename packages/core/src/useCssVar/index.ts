import { useCallback, useEffect, useRef, useState } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import { isBrowser } from "../utils/is";

export interface UseCssVarOptions {
  /**
   * Use MutationObserver to monitor variable changes
   * @default false
   */
  observe?: boolean;
}

const defaultOptions: UseCssVarOptions = {
  observe: false,
};

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

export default function useCssVar<T extends HTMLElement = HTMLElement>(
  prop: string,
  target: BasicTarget<T>,
  defaultValue?: string,
  options: UseCssVarOptions = defaultOptions,
) {
  const { observe } = options;
  const [variable, setVariable] = useState<string>(
    getInitialState(defaultValue),
  );
  const element = useLatestElement(target);
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
}
