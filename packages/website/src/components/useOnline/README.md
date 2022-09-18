# useOnline

A wrapper of `useNetwork`.

## Usage

```tsx
import { useOnline } from "@reactuses/core";

const Demo = () => {
  const online = useOnline();
  return <div>{online}</div>;
};
```

## Type Declarations

```ts
export default function useOnline(): boolean | undefined
```

## Examples
