# useReducedMotion

React Hook that tracks motion preference.

## Usage

```tsx
import { useReducedMotion } from "@reactuses/core";

const Demo = () => {
  const motion = useReducedMotion(false);

  return <div>ReducedMotion: {JSON.stringify(motion)}</div>;
};
```

## Type Declarations

:::warning
The defaultState? parameter must be set when using server side rendering, we need it to keep consistency in client side and server side.
:::

```ts
export default function useReducedMotion(defaultState?: boolean): boolean;
```
