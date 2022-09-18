# useMousePressed

React Sensor Hook that tracks mouse pressing state.

Triggered by mousedown touchstart on target element and released by mouseup mouseleave touchend touchcancel on window.

## Usage

```tsx
import { useMousePressed } from "@reactuses/core";

const Demo = () => {
  const [mouse, type] = useMousePressed();

  return (
    <div>
      <p>Pressed: {JSON.stringify(mouse)}</p>
      <p>SourceType: {type}</p>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```ts
export interface MousePressedOptions {
  /**
   * Listen to `touchstart` `touchend` events
   *
   * @default true
   */
  touch?: boolean;

  /**
   * Listen to `dragstart` `drop` and `dragend` events
   *
   * @default true
   */
  drag?: boolean;

  /**
   * Initial values
   *
   * @default false
   */
  initialValue?: IHookStateInitAction<boolean>;
}

export type MouseSourceType = "mouse" | "touch" | null;

export default function useMousePressed(
  target?: BasicTarget,
  options: MousePressedOptions = {}
): readonly [boolean, MouseSourceType]
```

>>>

## Examples
