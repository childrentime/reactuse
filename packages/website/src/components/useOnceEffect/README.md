# useOnceEffect

A Hook that avoids React18 useEffect run twice.

## Usage

```tsx
import { useOnceEffect } from "@reactuses/core";
import { useEffect, useState } from "react";

const Demo = () => {
  const [effect, setEffect] = useState(0);
  const [onceEffect, setOnceEffect] = useState(0);

  useOnceEffect(() => {
    setOnceEffect((onceEffect) => onceEffect + 1);
  }, []);

  useEffect(() => {
    setEffect((effect) => effect + 1);
  }, []);

  return (
    <div>
      <div>onceEffect: {onceEffect}</div>
      <br />
      <div>effect: {effect}</div>
    </div>
  );
};
```

## Examples
