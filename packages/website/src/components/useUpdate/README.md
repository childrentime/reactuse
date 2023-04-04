# useUpdate

React utility hook that returns a function that forces component to re-render when called.

## Usage

```tsx
import { useUpdate } from "@reactuses/core";

const Demo = () => {
  const update = useUpdate();
  return (
    <>
      <div>Time: {Date.now()}</div>
      <button onClick={update}>Update</button>
    </>
  );
};
```

## Type Declarations

```ts
export default function useUpdate(): () => void;
```

## Examples
