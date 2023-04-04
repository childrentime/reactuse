# useCounter

React state hook that tracks a numeric value.

## Usage

```tsx
import { useCounter } from "@reactuses/core";

const Demo = () => {
  const [current, set, inc, dec, reset] = useCounter(10, 100, 1);

  return (
    <div>
      <p>{current} max: 100; min: 1;</p>
      <div>
        <button
          type="button"
          onClick={() => {
            inc();
          }}
          style={{ marginRight: 8 }}
        >
          inc()
        </button>
        <button
          type="button"
          onClick={() => {
            dec();
          }}
          style={{ marginRight: 8 }}
        >
          dec()
        </button>
        <button
          type="button"
          onClick={() => {
            set(3);
          }}
          style={{ marginRight: 8 }}
        >
          set(3)
        </button>
        <button type="button" onClick={reset} style={{ marginRight: 8 }}>
          reset()
        </button>
      </div>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useCounter(
  initialValue: number | (() => number) = 0,
  max: number | null = null,
  min: number | null = null
): readonly [number, (newState: number | ((prev: number) => number) | (() => number)) => void, (delta?: number) => void, (delta?: number) => void, () => void];
```

## Examples
