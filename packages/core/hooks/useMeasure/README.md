# useMeasure

React sensor hook that tracks dimensions of an HTML element using the Resize Observer API.

## Usage

```tsx
import { useMeasure } from "@reactuses/core";
import { useRef } from "react";

export default () => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [rect, stop] = useMeasure(ref);

  return (
    <div>
      <div>Resize the box to see changes</div>
      <div>
        <button onClick={() => stop()}>stop observe</button>
      </div>
      <br />
      <textarea
        ref={ref}
        disabled
        style={{ width: 286, height: 166 }}
        value={JSON.stringify(rect, null, 2)}
      />
    </div>
  );
};
```