# useUnmount

React lifecycle hook that calls a function when the component will unmount.

## Usage

```tsx
import { useUnmount } from "@reactuses/core";

const Demo = () => {
  const [value] = useState("mounted");
  useUnmount(() => {
    alert("UnMounted");
  });
  return <div>{value}</div>;
};
```

## Type Declarations

```ts
export default function useUnmount(fn: () => void): void;
```
