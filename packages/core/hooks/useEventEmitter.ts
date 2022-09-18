import { useRef } from "react";

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

export default function useEventEmitter<T, U = void>() {
  const listeners = useRef<IListener<T, U>[]>([]);
  const _event = useRef<IEvent<T, U>>((listener: (arg1: T, arg2: U) => any) => {
    listeners.current.push(listener);
    const disposable = {
      dispose: () => {
        if (!_disposed.current) {
          for (let i = 0; i < listeners.current.length; i++) {
            if (listeners.current[i] === listener) {
              listeners.current.splice(i, 1);
              return;
            }
          }
        }
      },
    };
    return disposable;
  });

  const _disposed = useRef<boolean>(false);

  const fire = (arg1: T, arg2: U): void => {
    const queue: IListener<T, U>[] = [];

    for (let i = 0; i < listeners.current.length; i++) {
      queue.push(listeners.current[i]);
    }

    for (let i = 0; i < queue.length; i++) {
      queue[i].call(undefined, arg1, arg2);
    }
  };

  const dispose = (): void => {
    if (listeners.current.length !== 0) {
      listeners.current.length = 0;
    }
    _disposed.current = true;
  };

  return [_event.current, fire, dispose] as const;
}
