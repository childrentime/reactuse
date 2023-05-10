# useMediaDevices

React sensor hook that tracks connected hardware devices.

## Usage

```tsx
import { useMediaDevices } from "@reactuses/core";

const Demo = () => {
  const state = useMediaDevices();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
```
