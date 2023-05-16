# useDoubleClick

React sensor hook that controls double click and single click.

## Usage

```tsx
import { useDoubleClick } from "@reactuses/core";
import { useRef, useState } from "react";

export default () => {
  const element = useRef<HTMLButtonElement>(null);
  const [text,setText] = useState('no click')

  useDoubleClick({
    target: element,
    onSingleClick: () => {
      setText('single click')
    },
    onDoubleClick: () => {
      setText('double click')
    }
  })
  return (
    <div>
      <button ref={element}>Click Me</button>
      <p>{text}</p>
    </div>
  );
};
```
