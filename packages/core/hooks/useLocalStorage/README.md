# useLocalStorage

React side-effect hook that manages a single `localStorage` key.

## Usage

```tsx
import { useLocalStorage } from "@reactuses/core";

const Demo = () => {
  // bind string
  const [value, setValue] = useLocalStorage("my-key", "key");

  return (
    <div>
      <div>Value: {value}</div>
      <button onClick={() => setValue("bar")}>bar</button>
      <button onClick={() => setValue("baz")}>baz</button>
      {/* delete data from storage */}
      <button onClick={() => setValue(null)}>Remove</button>
    </div>
  );
};
```
