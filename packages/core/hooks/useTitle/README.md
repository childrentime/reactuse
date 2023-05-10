# useTitle

## Usage

```tsx
import { useState } from "react";
import { useTitle } from "@reactuses/core";

const Demo = () => {
  const [title, setTitle] = useState("title");

  useTitle(title);

  return (
    <div>
      <button onClick={() => setTitle("newTitle")}>Change Title</button>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useToggle(
  initialValue: boolean
): [boolean, (nextValue?: any) => void];
```
