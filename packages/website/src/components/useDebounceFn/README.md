# useDebounceFn

React hooks that [debounce](https://lodash.com/docs/4.17.15#debounce) function.

## Usage

```tsx
import { useDebounceFn } from "@reactuses/core";

const Demo = () => {
  const [value, setValue] = useState(0);
  const { run } = useDebounceFn(() => {
    setValue(value + 1);
  }, 500);

  return (
    <div>
      <p style={{ marginTop: 16 }}> Clicked count: {value} </p>
      <button type="button" onClick={run}>
        Click fast!
      </button>
    </div>
  );
};
```

## Type Declarations

```ts
export interface DebounceSettings {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export default function useDebounceFn<T extends (...args: any) => any>(
  fn: T,
  wait?: number,
  options?: DebounceSettings
): {
    run: DebouncedFunc<(...args: Parameters<T>) => ReturnType<T>>;
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
}
```

## Examples
