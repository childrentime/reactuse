# useEventListener

## Usage

```tsx
import { useEventListener } from "@reactuses/core";

const Demo = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState("NO DB Click");

  const onDBClick = () => {
    setState("DB Clicked");
  };

  const onClick = (event: Event) => {
    console.log("button clicked!", event);
  };

  const onVisibilityChange = (event: Event) => {
    console.log("doc visibility changed!", {
      isVisible: !document.hidden,
      event,
    });
  };

  // example with window based event
  useEventListener("dblclick", onDBClick);

  // example with document based event
  useEventListener("visibilitychange", onVisibilityChange, document);

  // example with element based event
  useEventListener("click", onClick, buttonRef);

  return (
    <div style={{ minHeight: "200vh" }}>
      <p>{state}</p>
      <button ref={buttonRef}>Click me</button>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```typescript

import { MutableRefObject } from "react";

type TargetValue<T> = T | undefined | null;
type TargetType = HTMLElement | Element | Window | Document | EventTarget;

export type BasicTarget<T extends TargetType = Element> =
  | (() => TargetValue<T>)
  | TargetValue<T>
  | MutableRefObject<TargetValue<T>>;

export type Target = BasicTarget<HTMLElement | Element | Window | Document | EventTarget>;

// Overload 1 Window Event based useEventListener interface
export default function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window,
  options?: boolean | AddEventListenerOptions
): void;

// Overload 2 Document Event based useEventListener interface
export default function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: boolean | AddEventListenerOptions
): void;

// Overload 3 HTMLElement Event based useEventListener interface
export default function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement = HTMLDivElement
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: T,
  options?: boolean | AddEventListenerOptions
): void;

// Overload 4 Element Event based useEventListener interface
export default function useEventListener<K extends keyof ElementEventMap>(
  eventName: K,
  handler: (event: ElementEventMap[K]) => void,
  element: Element,
  options?: boolean | AddEventListenerOptions
): void;

// Overload 5 Element Event based useEventListener interface
export default function useEventListener<K = Event>(
  eventName: string,
  handler: (event: K) => void,
  element: EventTarget | null | undefined,
  options?: boolean | AddEventListenerOptions
): void;

// Overload 6
export default function useEventListener(
  eventName: string,
  handler: (...p: any) => void,
  element?: Target,
  options?: boolean | AddEventListenerOptions
): void;
```

>>>

## Example
