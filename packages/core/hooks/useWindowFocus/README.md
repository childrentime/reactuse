# useWindowsFocus

React Element Hook that tracks window focus with `window.onfocus` and `window.onblur` events.

## Usage

```tsx
import { useWindowsFocus } from "@reactuses/core";

const Demo = () => {
  const focus = useWindowsFocus();
  return (
    <div>
      <p>
        {focus
          ? "💡 Click somewhere outside of the document to unfocus."
          : "ℹ Tab is unfocused"}
      </p>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useWindowsFocus(): boolean;
```
