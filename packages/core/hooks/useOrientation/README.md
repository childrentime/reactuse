# useOrientation

React sensor hook that tracks screen orientation of user's device.

Returns state in the following shape

## Usage

```tsx
import { useOrientation } from "@reactuses/core";

const Demo = () => {
  const [state] = useOrientation();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
```
