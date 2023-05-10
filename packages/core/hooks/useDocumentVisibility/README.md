# useDocumentVisibility

React Sensor Hook that tracks [document.visibilityState](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState).

## Usage

```tsx
import { useDocumentVisibility } from "@reactuses/core";

const Demo = () => {
  const visibility = useDocumentVisibility();
  const message = useRef("💡 Minimize the page or switch tab then return");

  useEffect(() => {
    message.current = "🎉 Welcome back!";
  }, [visibility]);

  return <div>{message.current}</div>;
};
```

## Type Declarations

```ts
export default function useDocumentVisibility(): DocumentVisibilityState;
```
