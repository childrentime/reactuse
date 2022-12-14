# useTimeoutFn

Wrapper for setTimeout with controls.

## Usage

```tsx
import { useTimeout } from "@reactuses/core";

const Demo = () => {
  const [isPending, start, cancel] = useTimeout(5000);

  return (
    <div>
      <div>Pending: {JSON.stringify(isPending)}</div>
      <button
        onClick={() => {
          start();
        }}
      >
        Start Again
      </button>
      <button
        onClick={() => {
          cancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
};
```

## Type Declarations

```ts
export type Stoppable = [boolean, Fn, Fn];
export interface UseTimeoutFnOptions {
  /**
   * Start the timer immediate after calling this function
   *
   * @default false
   */
  immediate?: boolean;
}

export default function useTimeoutFn(
  cb: (...args: unknown[]) => any,
  interval: number,
  options: UseTimeoutFnOptions = {}
): Stoppable
```

## Examples
