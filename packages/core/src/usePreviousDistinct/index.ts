import { useRef } from 'react';
import type { UsePreviousDistinct } from './interface';

const defaultCompare = <T>(prev: T | undefined, next: T) => prev === next;

export const usePreviousDistinct: UsePreviousDistinct = <T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = defaultCompare,
) => {
  const prevRef = useRef<T | undefined>(undefined);
  const curRef = useRef<T>(value);

  if (!compare(curRef.current, value)) {
    prevRef.current = curRef.current;
    curRef.current = value;
  }

  return prevRef.current;
};
