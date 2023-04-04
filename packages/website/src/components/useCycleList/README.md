# useCycleList

Cycle through a list of items.

## Usage

```tsx
import { useCycleList } from "@reactuses/core";

const Demo = () => {
  const [state, next, prev] = useCycleList([
    "Dog",
    "Cat",
    "Lizard",
    "Shark",
    "Whale",
    "Dolphin",
    "Octopus",
    "Seal",
  ]);

  return (
    <div>
      <div>{state}</div>
      <div>
        <button onClick={() => next()}>next</button>
        <button onClick={() => prev()}>prev</button>
      </div>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useCycleList<T>(
  list: T[],
  i = 0
): readonly [T, (i?: number) => void, (i?: number) => void];
```

## Examples
