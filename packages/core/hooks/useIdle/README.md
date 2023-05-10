# useIdle

React sensor hook that tracks if user on the page is idle.

## Usage

```tsx
import { useIdle } from "@reactuses/core";

const Demo = () => {
  const isIdle = useIdle(3e3);

  return (
    <div>
      <div>User is idle: {isIdle ? "Yes 😴" : "Nope"}</div>
    </div>
  );
};
```
