# useWindowScroll

## Usage

```tsx
import { useWindowScroll } from "@reactuses/core";

export default function App() {
  const state = useWindowScroll();

  return (
    <div
      style={{
        width: "200vw",
        height: "200vh"
      }}
    >
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0
        }}
      >
        <div>x: {state.x}</div>
        <div>y: {state.y}</div>
      </div>
    </div>
  );
}
```

## Type Declarations

```ts
export interface State {
  x: number;
  y: number;
}
export default function useWindowScroll(): State;
```
