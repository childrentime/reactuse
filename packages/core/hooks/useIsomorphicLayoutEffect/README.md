# useIsomorphicLayoutEffect

`useLayoutEffect` that does not show warning when server-side rendering, see [Alex Reardon's article](https://medium.com/@alexandereardon/uselayouteffect-and-ssr-192986cdcf7a) for more info.

## Usage

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";

const Demo = () => {
  const [value] = useState("useIsomorphicLayoutEffect");
  useIsomorphicLayoutEffect(() => {
    window.console.log(value);
  }, [value]);

  return <div>{value}</div>;
};
```
