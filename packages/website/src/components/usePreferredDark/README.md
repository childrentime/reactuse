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

```ts
export default function usePreferredDark(defaultState?: boolean): boolean
```

The defaultState parameter is only used as a fallback for server side rendering.

When server side rendering, it is important to set this parameter because without it the server's initial state will fallback to false, but the client will initialize to the result of the media query. When React hydrates the server render, it may not match the client's state. See the React docs for more on why this is can lead to costly bugs 🐛.

## Examples
