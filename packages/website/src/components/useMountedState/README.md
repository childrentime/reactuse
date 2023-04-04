# useMountedState

Lifecycle hook providing ability to check component's mount state.
Returns a function that will return `true` if component mounted and `false` otherwise.

## Usage

```tsx
import { useMountedState, useUpdate } from "@reactuses/core";

const Demo = () => {
  const isMounted = useMountedState();

  const [, update] = useState(0);
  useEffect(() => {
    update(1);
  }, []);
  return <div>This component is {isMounted() ? "MOUNTED" : "NOT MOUNTED"}</div>;
};
```

## Type Declarations

```ts
export default function useMountedState(): () => boolean;
```

## Examples
