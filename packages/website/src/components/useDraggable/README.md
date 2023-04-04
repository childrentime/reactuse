# useDraggable

Make elements draggable.

## Usage

```tsx
import { useDraggable } from "@reactuses/core";
import { useEffect, useRef, useState } from "react";

const Demo = () => {
  const el = useRef<HTMLDivElement>(null);

  const [initialValue, setInitialValue] = useState({ x: 200 / 2.2, y: 120 });

  useEffect(() => {
    setInitialValue({ x: window.innerWidth / 2.2, y: 120 });
  }, []);

  const [x, y, isDragging] = useDraggable(el, {
    initialValue,
    preventDefault: true,
  });

  return (
    <div>
      <p style={{ textAlign: "center" }}>Check the floating boxes</p>
      <div
        ref={el}
        style={{
          position: "fixed",
          cursor: "move",
          zIndex: 10,
          touchAction: "none",
          padding: 10,
          border: "solid 1px",
          left: x,
          top: y,
        }}
      >
        {isDragging ? "Dragging!" : "👋 Drag me!"}
        <div>
          I am at {Math.round(x)}, {Math.round(y)}
        </div>
      </div>
    </div>
  );
};
```

## Type Declarations

```ts
export interface UseDraggableOptions {
  /**
   * Only start the dragging when click on the element directly
   *
   * @default false
   */
  exact?: boolean;

  /**
   * Prevent events defaults
   *
   * @default false
   */
  preventDefault?: boolean;

  /**
   * Prevent events propagation
   *
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Element to attach `pointermove` and `pointerup` events to.
   *
   * @default window
   */
  draggingElement?: BasicTarget<HTMLElement | SVGElement | Window | Document>;

  /**
   * Handle that triggers the drag event
   *
   * @default target
   */
  handle?: BasicTarget<HTMLElement | SVGElement>;

  /**
   * Pointer types that listen to.
   *
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[];

  /**
   * Initial position of the element.
   *
   * @default { x: 0, y: 0 }
   */
  initialValue?: Position;

  /**
   * Callback when the dragging starts. Return `false` to prevent dragging.
   */
  onStart?: (position: Position, event: PointerEvent) => void | false;

  /**
   * Callback during dragging.
   */
  onMove?: (position: Position, event: PointerEvent) => void;

  /**
   * Callback when dragging end.
   */
  onEnd?: (position: Position, event: PointerEvent) => void;
}

export default function useDraggable(
  target: BasicTarget<HTMLElement | SVGElement>,
  options: UseDraggableOptions = {}
): readonly [number, number, boolean];
```

## Examples
