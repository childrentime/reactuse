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

## Type Declarations

>>> Show Type Declarations

```ts
export interface ScrollIntoViewAnimation {
  /** target element alignment relatively to parent based on current axis */
  alignment?: "start" | "end" | "center";
}

export interface ScrollIntoViewParams {
    /** callback fired after scroll */
    onScrollFinish?: () => void;
    /** duration of scroll in milliseconds */
    duration?: number;
    /** axis of scroll */
    axis?: "x" | "y";
    /** custom mathematical easing function */
    easing?: (t: number) => number;
    /** additional distance between nearest edge and element */
    offset?: number;
    /** indicator if animation may be interrupted by user scrolling */
    cancelable?: boolean;
    /** prevents content jumping in scrolling lists with multiple targets */
    isList?: boolean;
    targetElement: BasicTarget<HTMLElement>;
    scrollElement?: BasicTarget<HTMLElement>;
}
export function useScrollIntoView({ duration, axis, onScrollFinish, easing, offset, cancelable, isList, targetElement, scrollElement, }: ScrollIntoViewParams): {
    scrollIntoView: ({ alignment }?: ScrollIntoViewAnimation) => void;
    cancel: () => void;
}
```

>>>

## Examples
