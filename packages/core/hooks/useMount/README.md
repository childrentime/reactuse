# useMount

React lifecycle hook that executes a function after the component is mounted.

## Usage

```tsx
import { useMount } from "@reactuses/core";

const Demo = () => {
  const [value, setValue] = useState("UnMounted");
  useMount(() => {
    setValue("Mounted");
  });
  return <div>{value}</div>;
};
```

## Type Declarations

```ts
export default function useMount(fn: () => void): void;
```
