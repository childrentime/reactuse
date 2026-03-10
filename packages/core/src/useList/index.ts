import { useMemo, useRef, useState } from 'react';
import type { UseList } from './interface';

export const useList: UseList = <T>(initialList: T[] = []) => {
  const initialRef = useRef(initialList);
  const [list, setList] = useState<T[]>(initialList);

  const actions = useMemo(() => ({
    set: (newList: T[]) => setList(newList),
    push: (...items: T[]) => setList(prev => [...prev, ...items]),
    removeAt: (index: number) => setList(prev => prev.filter((_, i) => i !== index)),
    insertAt: (index: number, item: T) => setList(prev => [...prev.slice(0, index), item, ...prev.slice(index)]),
    updateAt: (index: number, item: T) => setList(prev => prev.map((v, i) => (i === index ? item : v))),
    clear: () => setList([]),
    reset: () => setList(initialRef.current),
    filter: (fn: (item: T, index: number) => boolean) => setList(prev => prev.filter(fn)),
    sort: (fn?: (a: T, b: T) => number) => setList(prev => [...prev].sort(fn)),
  }), []);

  return [list, actions] as const;
};
