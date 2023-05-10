# useThrottleFn

React hooks that [throttle](https://lodash.com/docs/4.17.15#throttle) function.

## Usage

```tsx
import { useThrottleFn } from "@reactuses/core";

const Demo = () => {
  const [value, setValue] = useState(0);
  const { run } = useThrottleFn(() => {
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
