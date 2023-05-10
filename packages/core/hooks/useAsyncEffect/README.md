# useAsyncEffect

React useEffect with async await support. Note it don't support generator function.

## Usage

```tsx
import { useAsyncEffect } from "@reactuses/core";
import { useState } from "react";

const Demo = () => {
  const [data, setData] = useState(0);

  useAsyncEffect(
    async () => {
      const result = await new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(200);
        }, 5000);
      });
      setData(result);
    },
    () => {},
    []
  );
  return <div>data: {data}</div>;
};
```
