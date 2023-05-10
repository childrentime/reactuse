# useEventEmitter

A basic eventemitter.

## Usage

```tsx
import { useEventEmitter } from "@reactuses/core";
import { IDisposable } from "@reactuses/core/hooks/useEventEmitter";
import { useEffect, useRef, useState } from "react";

const Demo = () => {
  const [state, setState] = useState(0);
  const [event, fire, dispose] = useEventEmitter<number>();

  const event1 = useRef<IDisposable>();
  useEffect(() => {
    event((val) => {
      setState(s => s + val);
    });
    event1.current = event(val => setState(s => s + val + 10));
  }, [event]);

  return (
    <div>
      <div>state: {state}</div>
      <button onClick={() => fire(1)}>fire</button>
      <button onClick={() => dispose()}>disposeALL</button>
      <button onClick={() => event1.current?.dispose()}>disposeOne</button>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```typescript
export interface IListener<T, U = void> {
  (arg1: T, arg2: U): void;
}
export interface IDisposable {
  dispose(): void;
}
export interface IEvent<T, U = void> {
  (listener: (arg1: T, arg2: U) => any): IDisposable;
}
export interface IEventOnce<T, U = void> {
  (listener: (arg1: T, arg2: U) => any): void;
}
export interface UseEventEmitterReturn<T, U = void> {
  /**
   * Subscribe to an event. When calling emit, the listeners will execute.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  event: IEvent<T, U>;
  /**
   * fire an event, the corresponding event listeners will execute.
   * @param event data sent.
   */
  fire: (arg1: T, arg2: U) => void;
  /**
   * Remove all corresponding listener.
   */
  dispose: () => void;
}
export default function useEventEmitter<T, U = void>(): readonly [
  IEvent<T, U>,
  (arg1: T, arg2: U) => void,
  () => void
];
```

>>>

## Example
