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

:::warning
The defaultState? parameter must be set when using server side rendering, we need it to keep consistency in client side and server side.
:::

```ts
export type ColorScheme = "dark" | "light" | "no-preference";
export default function usePreferredColorScheme(
  defaultState?: ColorScheme
): ColorScheme;
```

## Examples
