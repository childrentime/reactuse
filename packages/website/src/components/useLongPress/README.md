# useLongPress

React sensor hook that fires a callback after long pressing.

## Usage

```tsx
import { useLongPress } from "@reactuses/core";
import { useState } from "react";

const Demo = () => {
  const [state, setState] = useState("No Press");
  const onLongPress = () => {
    setState("Long Pressed!");
  };

  const defaultOptions = {
    isPreventDefault: true,
    delay: 300,
  };
  const longPressEvent = useLongPress(onLongPress, defaultOptions);

  return (
    <div>
      <button {...longPressEvent}>useLongPress</button>
      <button onClick={() => setState("No Press")}>Reset</button>
      <div>Pressed: {state}</div>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```ts
export interface Options {
  isPreventDefault?: boolean;
  delay?: number;
}

export default function useLongPress(
  callback: (e: TouchEvent | MouseEvent) => void,
  { isPreventDefault = true, delay = 300 }: Options = {}
): {
  readonly onMouseDown: (e: any) => void;
  readonly onTouchStart: (e: any) => void;
  readonly onMouseUp: () => void;
  readonly onMouseLeave: () => void;
  readonly onTouchEnd: () => void;
};
```

>>>

## Examples
