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
