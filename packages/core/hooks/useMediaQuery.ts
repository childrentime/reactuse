import { useEffect, useState } from "react";
import { isBrowser } from "./utils/is";

const getInitialState = (query: string, defaultState?: boolean) => {
  // Prevent a React hydration mismatch when a default value is provided by not defaulting to window.matchMedia(query).matches.
  if (defaultState !== undefined) {
    return defaultState;
  }

  if (isBrowser) {
    return window.matchMedia(query).matches;
  }

  // A default value has not been provided, and you are rendering on the server, warn of a possible hydration mismatch when defaulting to false.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`useMediaQuery` When server side rendering, defaultState should be defined to prevent a hydration mismatches."
    );
  }

  return false;
};

export default function useMediaQuery(query: string, defaultState?: boolean) {
  const [state, setState] = useState(getInitialState(query, defaultState));

  useEffect(() => {
    let mounted = true;
    const mql = window.matchMedia(query);
    const onChange = () => {
      if (!mounted) {
        return;
      }
      setState(!!mql.matches);
    };

    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange);
    } else {
      // @ts-ignore
      mql.addListener(onChange);
    }

    setState(mql.matches);

    return () => {
      mounted = false;
      if ("removeEventListener" in mql) {
        mql.removeEventListener("change", onChange);
      } else {
        // @ts-ignore
        mql.removeListener(onChange);
      }
    };
  }, [query]);

  return state;
}
