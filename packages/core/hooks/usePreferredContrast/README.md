# usePreferredContrast

[prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) media query.

## Usage

```tsx
import { usePreferredContrast } from "@reactuses/core";

const Demo = () => {
  const contrast = usePreferredContrast();

  return <div>PreferredContrast: {contrast}</div>;
};
```

:::warning
The defaultState? parameter must be set when using server side rendering, we need it to keep consistency in client side and server side.
:::
