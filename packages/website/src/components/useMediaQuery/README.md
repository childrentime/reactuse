# useMediaQuery

## Usage

```tsx
import { useMediaQuery } from "@reactuses/core";

const Demo = () => {
  const isWide = useMediaQuery("(min-width: 480px)");

  return <div>Screen is wide: {isWide ? "Yes" : "No"}</div>;
};
```

## Type Declarations

```ts
export default function useMediaQuery(
  query: string,
  serverFallback?: boolean
): boolean
```

The second parameter is only used as a fallback for server side rendering. It's just like the third  parameter of [useSyncExternalStore](https://github.com/reactwg/react-18/discussions/86) hook.

## Examples
