# useFps

React Sensor Hooks that tracks FPS (frames per second).

## Usage

```tsx
import { useFps } from "@reactuses/core";

const Demo = () => {
  const fps = useFps();

  return <div>FPS: {fps}</div>;
};
```

## Type Declarations

```ts
export interface UseFpsOptions {
  /**
   * Calculate the FPS on every x frames.
   * @default 10
   */
  every?: number;
}


function useFps(options?: UseFpsOptions): number
```

## Examples
