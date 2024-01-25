import { useEffect } from "react";
import useLatest from "../useLatest";
import { defaultWindow, off, on } from "../utils/browser";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import { defaultOptions } from "../utils/defaults";

export type Target = BasicTarget<
  HTMLElement | Element | Window | Document | EventTarget
>;

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
  K extends keyof HTMLElementEventMap, T extends HTMLElement = HTMLDivElement,
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

export default function useEventListener(
  eventName: string,
  handler: (...p: any) => void,
  element?: Target,
  options: boolean | AddEventListenerOptions = defaultOptions,
) {
  const savedHandler = useLatest(handler);
  const targetElement = useLatestElement(element, defaultWindow);

  useEffect(() => {
    if (!(targetElement && targetElement.addEventListener)) {
      return;
    }

    const eventListener: typeof handler = event =>
      savedHandler.current(event);

    on(targetElement, eventName, eventListener, options);

    return () => {
      if (!(targetElement && targetElement.removeEventListener)) {
        return;
      }
      off(targetElement, eventName, eventListener);
    };
  }, [eventName, targetElement, options, savedHandler]);
}
