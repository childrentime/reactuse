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
