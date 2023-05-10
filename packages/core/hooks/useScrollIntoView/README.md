# useScrollIntoView

React sensor hook works like `element.scrollIntoView()`

## Usage

```tsx
import { useScrollIntoView } from "@reactuses/core";
import { useRef } from "react";

const Demo = () => {
  const targetRef = useRef<HTMLParagraphElement>(null);
  const { scrollIntoView } = useScrollIntoView({
    offset: 60,
    targetElement: targetRef,
  });

  return (
    <div>
      <button onClick={() => scrollIntoView({ alignment: "center" })}>
        Scroll to target
      </button>
      <div style={{ height: "50vh" }} />
      <p ref={targetRef}>Hello there</p>
    </div>
  );
};
```
