import { getIsReactActEnvironment, setIsReactActEnvironment } from "./act";
import { cleanup } from "./renderHook";

if (typeof process === "undefined" || !process.env?.RTL_SKIP_AUTO_CLEANUP) {
  if (typeof afterEach === "function") {
    afterEach(() => {
      cleanup();
    });
  }

  if (typeof beforeAll === "function" && typeof afterAll === "function") {
    let previousIsReactActEnvironment = getIsReactActEnvironment();
    beforeAll(() => {
      previousIsReactActEnvironment = getIsReactActEnvironment();
      setIsReactActEnvironment(true);
    });

    afterAll(() => {
      setIsReactActEnvironment(previousIsReactActEnvironment);
    });
  }
}

export * from "./act";
export * from "./waitFor";
export * from "./renderHook";
