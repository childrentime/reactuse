# usePrevious

React state hook that returns the previous state as described in the [React hooks FAQ](https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state).

## Usage

```tsx
import { usePrevious } from "react-use";

const Demo = () => {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <p>
        Now: {count}, before: {prevCount}
      </p>
    </div>
  );
};
```

## Type Declarations

```ts
export default function usePreferredDark(): boolean
```

## Examples
