# useElementBounding

React Element Hook that tracks bounding box of an HTML element.

## Usage

```tsx
import { useRef } from "react";
import { useElementBounding } from "@reactuses/core";

const Demo = () => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const rect = useElementBounding(ref);
  return (
    <div>
      <p> Resize the box to see changes</p>
      <textarea ref={ref} readOnly value={JSON.stringify(rect, null, 2)} />
    </div>
  );
};
```

## Type Declarations

>>> show type declaration

```ts
export interface UseElementBoundingOptions {
  /**
   * Reset values to 0 on component unmounted
   *
   * @default true
   */
  reset?: boolean;

  /**
   * Listen to window resize event
   *
   * @default true
   */
  windowResize?: boolean;
  /**
   * Listen to window scroll event
   *
   * @default true
   */
  windowScroll?: boolean;

  /**
   * Immediately call update on component mounted
   *
   * @default true
   */
  immediate?: boolean;
}

export default function useElementBounding(
  target: BasicTarget,
  options: UseElementBoundingOptions = {}
): {
  readonly height: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
  readonly update: () => void;
}
```

>>>

## Examples
