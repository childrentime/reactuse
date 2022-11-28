import { useEffect, useState } from "react";
import { ThrottleSettings } from "./utils/external";
import useThrottleFn from "./useThrottleFn";

export default function useThrottle<T>(
  value: T,
  wait?: number,
  options?: ThrottleSettings
) {
  const [throttled, setThrottled] = useState(value);

  const { run } = useThrottleFn(
    () => {
      setThrottled(value);
    },
    wait,
    options
  );

  useEffect(() => {
    run();
  }, [run, value]);

  return throttled;
}
