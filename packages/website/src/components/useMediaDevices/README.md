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

## Type Declarations

```ts
export default function useMediaDevices(): {
  devices: {
    deviceId: string;
    groupId: string;
    kind: MediaDeviceKind;
    label: string;
  }[];
};
```

## Examples
