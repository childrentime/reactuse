# useElementBounding

React Element Hook that tracks bounding box of an HTML element.

## Usage

```tsx
import { useRef } from "react";
import { useElementBounding } from "@reactuses/core";

const Demo = () => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const rect = useElementBounding(ref);
  return (
    <div>
      <p> Resize the box to see changes</p>
      <textarea ref={ref} readOnly value={JSON.stringify(rect, null, 2)} />
    </div>
  );
};
```
