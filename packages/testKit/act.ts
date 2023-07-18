import { act as reactAct } from "react-dom/test-utils";

const getGlobalThis = () => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
};

const setIsReactActEnvironment = (isReactActEnvironment: boolean) => {
  getGlobalThis().IS_REACT_ACT_ENVIRONMENT = isReactActEnvironment;
};

const getIsReactActEnvironment = (): boolean => {
  return getGlobalThis().IS_REACT_ACT_ENVIRONMENT;
};

const act: typeof reactAct = (callback) => {
  const previousActEnvironment = getIsReactActEnvironment();
  setIsReactActEnvironment(true);
  try {
    // The return value of `act` is always a thenable.
    let callbackNeedsToBeAwaited = false;
    const actResult = reactAct(() => {
      const result = callback();
      if (
        result !== null
        && typeof result === "object"
        && typeof result.then === "function"
      ) {
        callbackNeedsToBeAwaited = true;
      }
      return result;
    });
    if (callbackNeedsToBeAwaited) {
      const thenable = actResult;
      return {
        then: (resolve, reject) => {
          thenable.then(
            (returnValue) => {
              setIsReactActEnvironment(previousActEnvironment);
              resolve(returnValue);
            },
            (error) => {
              setIsReactActEnvironment(previousActEnvironment);
              reject(error);
            },
          );
        },
      } as any;
    }
    else {
      setIsReactActEnvironment(previousActEnvironment);
      return actResult;
    }
  }
  catch (error) {
    setIsReactActEnvironment(previousActEnvironment);
    throw error;
  }
};

export { act, getIsReactActEnvironment, setIsReactActEnvironment };
