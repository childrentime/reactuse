# useTextSelection

Track user text selection based on [document.getSelection](https://developer.mozilla.org/en-US/docs/Web/API/Document/getSelection)

## Usage

```tsx
import { useTextSelection } from "@reactuses/core";

const Demo = () => {
  const selection = useTextSelection();
  return (
    <div style={{ padding: 40 }}>
      <p>
        Select some text here or anywhere on the page and it will be displayed
        below
      </p>
      <div>Selected text: {selection?.toString()}</div>
    </div>
  );
};
```
