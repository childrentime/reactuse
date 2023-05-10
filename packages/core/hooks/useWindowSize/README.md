# useWindowSize

React Element Hooks that tracks window size.

## Usage

```tsx
import { useWindowSize } from "@reactuses/core";

const Demo = () => {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>
        width: {width}, height: {height}
      </p>
    </div>
  );
};
```
