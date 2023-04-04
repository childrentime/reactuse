# useDeepCompareEffect

A modified useEffect hook that is using deep comparison on its dependencies instead of reference equality.

## Usage

```tsx
import { useDeepCompareEffect } from "@reactuses/core";
import { useEffect, useRef, useState } from "react";

const Demo = () => {
  const [count, setCount] = useState(0);
  const effectCountRef = useRef(0);
  const deepCompareCountRef = useRef(0);

  useEffect(() => {
    effectCountRef.current += 1;
  }, [{}]);

  useDeepCompareEffect(() => {
    deepCompareCountRef.current += 1;
    return () => {
      // do something
    };
  }, [{}]);

  return (
    <div>
      <p>effectCount: {effectCountRef.current}</p>
      <p>deepCompareCount: {deepCompareCountRef.current}</p>
      <p>
        <button type="button" onClick={() => setCount(c => c + 1)}>
          reRender
        </button>
      </p>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useDeepCompareEffect(
  effect: EffectCallback,
  deps: DependencyList
): void;
```

## Examples
