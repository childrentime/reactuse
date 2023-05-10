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
