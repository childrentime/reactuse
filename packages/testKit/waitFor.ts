import assert from "node:assert";
import { jestFakeTimersAreEnabled } from "./env";

export interface IWaitForOptions {
  timeout?: number;
  interval?: number;
  onTimeout?: (error: unknown) => unknown;
}

const isThenable = (value: unknown) => {
  const thenable = (value as Promise<unknown>)?.then;
  return typeof thenable === "function" && thenable;
};

const waitFor = <T>(
  callback: () => Promise<T> | T,
  options: IWaitForOptions = {}
) => {
  assert(
    typeof callback === "function",
    "Received `callback` arg must be a function"
  );
  const {
    timeout = 1000,
    interval = 50,
    onTimeout = (error) => {
      console.log(error);
      return error;
    },
  } = options;

  return new Promise(async (resolve, reject) => {
    const usingJestFakeTimers = jestFakeTimersAreEnabled();
    let finished = false;
    let intervalId: ReturnType<typeof setInterval>;
    let lastError: unknown;

    const handleTimeout = () => {
      const error = lastError || new Error("Timed out in waitFor.");
      finish(onTimeout(error), null);
    };
    const timeoutTimer = setTimeout(handleTimeout, timeout);

    const finish = (error, result) => {
      finished = true;
      clearTimeout(timeoutTimer);
      if (!usingJestFakeTimers) {
        clearInterval(intervalId);
      }

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    const checkCallback = () => {
      try {
        const result = callback();
        console.log('result',result)
        /**
         * @description why we need this? because we don't want to [GET] then twice
         */
        const thenable = isThenable(result);
        if (thenable) {
          thenable(
            (resolvedValue) => {
              finish(null, resolvedValue);
            },
            (rejectedValue) => {
              lastError = rejectedValue;
            }
          );
        } else {
          finish(null, result);
        }
      } catch (error) {
        lastError = error;
      }
    };

    if (usingJestFakeTimers) {
      checkCallback();

      while (!finished) {
        if (!jestFakeTimersAreEnabled()) {
          const error = new Error(
            `Changed from using fake timers to real timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to real timers.`
          );
          reject(error);
          return;
        }

        await jest.advanceTimersByTimeAsync(interval);

        checkCallback();
        if (finished) {
          break;
        }
      }
    } else {
      const checkRealTimersCallback = () => {
        if (jestFakeTimersAreEnabled()) {
          const error = new Error(
            `Changed from using real timers to fake timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to fake timers.`
          );
          reject(error);
          return;
        }
        checkCallback();
      };

      intervalId = setInterval(checkRealTimersCallback, interval);
      checkCallback();
    }
  });
};

export { waitFor };
