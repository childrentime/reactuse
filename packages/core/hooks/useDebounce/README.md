# useDebounce

React hooks that [debounce](https://lodash.com/docs/4.17.15#debounce) value.

## Usage

```tsx
import { useDebounce } from "@reactuses/core";

const Demo = () => {
  const [value, setValue] = useState<string>();
  const debouncedValue = useDebounce(value, 500);

  return (
    <div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Typed value"
        style={{ width: 280 }}
      />
      <p style={{ marginTop: 16 }}>DebouncedValue: {debouncedValue}</p>
    </div>
  );
};
```
