# useThrottle

React hooks that [throttle](https://lodash.com/docs/4.17.15#throttle) value.

## Usage

```tsx
import { useThrottle } from "@reactuses/core";

const Demo = () => {
  const [value, setValue] = useState<string>();
  const throttledValue = useThrottle(value, 500);

  return (
    <div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Typed value"
        style={{ width: 280 }}
      />
      <p style={{ marginTop: 16 }}>throttledValue: {throttledValue}</p>
    </div>
  );
};
```

## Type Declarations

```ts
export interface ThrottleSettings {
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}

export default function useThrottle<T>(
  value: T,
  wait?: number,
  options?: ThrottleSettings
): T;
```
