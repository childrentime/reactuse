# usePermission

React side-effect hook to query permission status of browser APIs.

## Usage

```tsx
import { usePermission } from "@reactuses/core";

const Demo = () => {
  const state = usePermission({ name: "microphone" });

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
```

## Type Declarations

>>> Show Type Declarations

```ts
export type IState = PermissionState | "";

type DescriptorNamePolyfill =
  | "accelerometer"
  | "accessibility-events"
  | "ambient-light-sensor"
  | "background-sync"
  | "camera"
  | "clipboard-read"
  | "clipboard-write"
  | "gyroscope"
  | "magnetometer"
  | "microphone"
  | "notifications"
  | "payment-handler"
  | "persistent-storage"
  | "push"
  | "speaker";

export type GeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: DescriptorNamePolyfill };

export default function usePermission(
  permissionDesc:
  | GeneralPermissionDescriptor
  | GeneralPermissionDescriptor["name"]
): IState;
```

>>>

## Examples
