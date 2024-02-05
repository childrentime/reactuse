import { useEffect, useState } from "react";
import { useInterval } from "../useInterval";
import type { UseCountDown } from "./interface";

const padZero = (time: number): string => {
  return `${time}`.length < 2 ? `0${time}` : `${time}`;
};

export const getHMSTime = (timeDiff: number): [string, string, string] => {
  if (timeDiff <= 0) {
    return ["00", "00", "00"];
  }
  if (timeDiff > 100 * 3600) {
    return ["99", "59", "59"];
  }
  const hour = Math.floor(timeDiff / 3600);
  const minute = Math.floor((timeDiff - hour * 3600) / 60);
  const second = timeDiff - hour * 3600 - minute * 60;
  return [padZero(hour), padZero(minute), padZero(second)];
};

export const useCountDown: UseCountDown = (
  time: number,
  format: (num: number) => [string, string, string] = getHMSTime,
  callback?: () => void,
) => {
  const [remainTime, setRemainTime] = useState(time);
  const [delay, setDelay] = useState<number | null>(1000);

  useInterval(() => {
    if (remainTime <= 0) {
      setDelay(null);
      return;
    }
    setRemainTime(remainTime - 1);
  }, delay);

  useEffect(() => {
    if (time > 0 && remainTime <= 0) {
      callback && callback();
    }
  }, [callback, remainTime, time]);

  const [hour, minute, secoud] = format(remainTime);

  return [hour, minute, secoud] as const;
};
