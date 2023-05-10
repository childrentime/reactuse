# useElementSize

React Sensor Hook that tracks size of an HTML element. [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

## Usage

```tsx
import { useElementSize } from "@reactuses/core";
import { useRef } from "react";

const Demo = () => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const [width, height] = useElementSize(ref, { box: "border-box" });

  return (
    <div>
      <div>Resize the box to see changes</div>
      <br />
      <textarea
        ref={ref}
        disabled
        style={{ width: 200, height: 200 }}
        value={`width: ${width}\nheight: ${height}`}
      />
    </div>
  );
};
```

## Type Declarations

```ts
export default function useElementSize(
  target: BasicTarget,
  options: ResizeObserverOptions = {}
): readonly [number, number];
```
