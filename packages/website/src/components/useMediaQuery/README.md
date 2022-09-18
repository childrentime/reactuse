# useMediaQuery

## Usage

```tsx
import { useMediaQuery } from "@reactuses/core";

const Demo = () => {
  const isWide = useMediaQuery("(min-width: 480px)");

  return <div>Screen is wide: {isWide ? "Yes" : "No"}</div>;
};
```

The defaultState parameter is only used as a fallback for server side rendering.

When server side rendering, it is important to set this parameter because without it the server's initial state will fallback to false, but the client will initialize to the result of the media query. When React hydrates the server render, it may not match the client's state. See the React docs for more on why this is can lead to costly bugs 🐛.

## Type Declarations

```ts
export default function useMediaQuery(query: string, defaultState?: boolean): boolean
```

The defaultState parameter is only used as a fallback for server side rendering.

When server side rendering, it is important to set this parameter because without it the server's initial state will fallback to false, but the client will initialize to the result of the media query. When React hydrates the server render, it may not match the client's state. See the React docs for more on why this is can lead to costly bugs 🐛.

## Examples
