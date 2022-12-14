# useFirstMountState

React state hook that returns true if component is just mounted.

## Usage

```tsx
import { useFirstMountState } from "react-use";

const Demo = () => {
  const isFirstMount = useFirstMountState();
  const [render, reRender] = useState(0);

  return (
    <div>
      <span>This component is just mounted: {isFirstMount ? "YES" : "NO"}</span>
      <br />
      <button onClick={() => reRender(1)}>{render}</button>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useFirstMountState(): boolean
```

## Examples
