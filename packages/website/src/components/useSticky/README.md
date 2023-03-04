# useSticky

React Hook that tracks element sticky.

## Usage

```tsx
import { useSticky } from "@reactuses/core";
import { CSSProperties, useRef } from "react";

const Demo = () => {
  const element = useRef<HTMLDivElement>(null);
  const [isSticky] = useSticky({
    targetElement: element,
    // header fixed height
    nav: 64,
  });

  const stickyStyle: CSSProperties = isSticky
    ? {
        position: "fixed",
        top: 64,
        zIndex: 50,
        height: 20,
      }
    : {
        height: 20,
      };

  const guardStyle: CSSProperties = {
    width: 1,
    height: 1,
  };

  return (
    <div>
      <div ref={element} style={guardStyle} />
      <button style={stickyStyle}>
        {isSticky ? "stickying" : "not sticky"}
      </button>
      <div style={{ height: "100vh" }} />
    </div>
  );
};
```

## Type Declarations

```ts
export interface UseStickyParams {
  targetElement: BasicTarget<HTMLElement>;
  scrollElement?: BasicTarget<HTMLElement>;
  /** axis of scroll */
  axis?: "x" | "y";
  /** cover height or width */
  nav: number;
}

export default function useSticky ({ targetElement, scrollElement, axis, nav, }: UseStickyParams) => [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
]
```

## Examples
