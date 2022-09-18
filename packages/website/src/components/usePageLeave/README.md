# usePageLeave

React sensor hook that tracks when mouse leaves the page.

## Usage

```tsx
import { usePageLeave } from "@reactuses/core";

const Demo = () => {
  const isLeft = usePageLeave();

  return <div>isLeft: {JSON.stringify(isLeft)}</div>;
};
```

## Type Declarations

```ts
export default function usePageLeave(): boolean
```

## Examples
