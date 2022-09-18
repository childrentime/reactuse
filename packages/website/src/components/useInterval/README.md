# useInterval

A declarative interval hook based on [Dan Abramov's article on overreacted.io](https://overreacted.io/making-setinterval-declarative-with-react-hooks/). The interval can be paused by setting the delay to null.

## Usage

```tsx
import { useInterval } from "@reactuses/core";

const Demo = () => {
  const [count, setCount] = useState(0);

  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  return <div>count: {count}</div>;
};
```

## Type Declarations

```ts
export default function useInterval(
  callback: () => void,
  delay?: number | null,
  options?: {
    immediate?: boolean;
  }
): void
```

## Examples
