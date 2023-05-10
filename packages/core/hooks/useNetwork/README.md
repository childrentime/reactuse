# useNetwork

Tracks the state of browser's network connection.

As of the standard it is not guaranteed that browser connected to the Internet, it only guarantees the network connection.

## Usage

```tsx
import { useNetwork } from "@reactuses/core";

const Demo = () => {
  const state = useNetwork();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
```
