# usePreferredDark

React Hook that tracks dark theme preference.

## Usage

```tsx
import { usePreferredDark } from "@reactuses/core";

const Demo = () => {
  const isDark = usePreferredDark();

  return <div>PreferredDark: {isDark}</div>;
};
```

## Type Declarations

:::warning
The defaultState? parameter must be set when using server side rendering, we need it to keep consistency in client side and server side.
:::

```ts
export default function usePreferredDark(defaultState?: boolean): boolean;
```
