import { useState } from "react";
import useMount from "./useMount";
import { off, on } from "./utils/browser";

export type KeyModifier =
  | "Alt"
  | "AltGraph"
  | "CapsLock"
  | "Control"
  | "Fn"
  | "FnLock"
  | "Meta"
  | "NumLock"
  | "ScrollLock"
  | "Shift"
  | "Symbol"
  | "SymbolLock";

const defaultEvents: (keyof WindowEventMap)[] = [
  "mousedown",
  "mouseup",
  "keydown",
  "keyup",
];

export interface UseModifierOptions {
  /**
   * Event names that will prompt update to modifier states
   *
   * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
   */
  events?: (keyof WindowEventMap)[];

  /**
   * Initial value of the returned ref
   *
   * @default false
   */
  initial?: boolean;
}

export default function useKeyModifier(
  modifier: KeyModifier,
  options: UseModifierOptions = {},
): boolean {
  const { events = defaultEvents, initial = false } = options;

  const [state, setState] = useState<boolean>(initial);

  useMount(() => {
    events.forEach((listenEvent) => {
      on(document, listenEvent, (evt: KeyboardEvent) => {
        if (typeof evt.getModifierState === "function") {
          setState(evt.getModifierState(modifier));
        }
      });
    });

    return () => {
      events.forEach((listenerEvent) => {
        off(document, listenerEvent, (evt: KeyboardEvent) => {
          if (typeof evt.getModifierState === "function") {
            setState(evt.getModifierState(modifier));
          }
        });
      });
    };
  });

  return state;
}
