# useCustomCompareEffect

A modified useEffect hook that accepts a comparator which is used for comparison on dependencies instead of reference equality.

## Usage

```tsx
import { useCustomCompareEffect } from "@reactuses/core";
import { useState } from "react";

const Demo = () => {
  const [person, setPerson] = useState({ name: "bob", id: 1 });
  const [count, setCount] = useState(0);
  useCustomCompareEffect(
    () => {
      setCount(c => c + 1);
    },
    [person],
    (prevDeps, nextDeps) => prevDeps[0].id === nextDeps[0].id
  );

  return (
    <div>
      <button
        onClick={() => {
          setPerson({ name: "joey", id: 1 });
        }}
      >
        Change Person Name
      </button>
      <button
        onClick={() => {
          setPerson({ name: "bob", id: 2 });
        }}
      >
        Change Person Id
      </button>
      <p>useCustomCompareEffect with deep comparison: {count}</p>
    </div>
  );
};
```

## Type Declarations

```ts
import { DependencyList, EffectCallback, useEffect, useRef } from "react";

const isPrimitive = (val: any) => val !== Object(val);

type DepsEqualFnType<TDeps extends DependencyList> = (
  prevDeps: TDeps,
  nextDeps: TDeps
) => boolean;

export default function useCustomCompareEffect<TDeps extends DependencyList>(
  effect: EffectCallback,
  deps: TDeps,
  depsEqual: DepsEqualFnType<TDeps>
): void;
```
