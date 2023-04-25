# useCountDown

React State Hooks that return the minutes gracefully

## Usage

```tsx
import { useCountDown } from "@reactuses/core";

const Demo = () => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffInSec = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

  // note: If your app is running in server side, must pass the same time as the client
  // this demo is not running in server side
  const [hour, minute, second] = useCountDown(diffInSec);
  return (
    <div suppressHydrationWarning={true}>{`${hour}:${minute}:${second}`}</div>
  );
};
```

## Type Declarations

If the time is less than 0, by default we'll return 00 for both, and if the time is more than 100 hours, we'll return 99, 59, 59. You can pass your custom format function.

```typescript
useCountDown(time: number, format?: ((number: any) => [string, string, string]) | undefined, callback?: (() => void) | undefined): readonly [string, string, string]
```

## Examples
