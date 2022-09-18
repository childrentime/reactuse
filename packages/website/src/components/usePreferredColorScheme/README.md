# usePreferredColorScheme

[prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) media query.

## Usage

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

const Demo = () => {
  const color = usePreferredColorScheme();

  return <div>PreferredColorScheme: {color}</div>;
};
```

## Type Declarations

```ts
export type ColorScheme = "dark" | "light" | "no-preference";
export default function usePreferredColorScheme(
  defaultState?: ColorScheme
): ColorScheme
```

The defaultState parameter is only used as a fallback for server side rendering.

When server side rendering, it is important to set this parameter because without it the server's initial state will fallback to false, but the client will initialize to the result of the media query. When React hydrates the server render, it may not match the client's state. See the React docs for more on why this is can lead to costly bugs 🐛.

## Examples
