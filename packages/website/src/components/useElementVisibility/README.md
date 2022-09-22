# useElementVisibility

React Element Hooks that tracks the visibility of an element within the viewport. A wrapper of `useIntersectionObserver`

## Usage

```tsx
import { useElementVisibility } from "@reactuses/core";
import { useRef } from "react";

const Demo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, stop] = useElementVisibility(ref);

  return (
    <div>
      <p>Info on the right bottom corner</p>
      <div
        ref={ref}
        style={{
          borderWidth: 2,
          borderStyle: "solid",
          padding: "1rem",
        }}
      >
        Target Element (scroll down)
      </div>
      <button
        onClick={() => {
          stop();
        }}
      >
        Stop
      </button>
      <div
        style={{
          borderWidth: 2,
          borderStyle: "solid",
          padding: "1rem",
          position: "fixed",
          bottom: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        Element {visible ? "inside" : "outside"} the viewport
      </div>
    </div>
  );
};
```


## Type Declarations

```ts
export default function useElementVisibility(
  target: BasicTarget<HTMLElement | SVGElement>,
  options: IntersectionObserverInit = {}
): boolean
```

## Examples
