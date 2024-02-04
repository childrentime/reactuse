import { useState } from "react";
import useMount from "../useMount";
import { off, on } from "../utils/browser";
import { defaultOptions } from "../utils/defaults";
import type { KeyModifier, UseKeyModifier, UseModifierOptions } from "./interface";

const defaultEvents: (keyof WindowEventMap)[] = [
  "mousedown",
  "mouseup",
  "keydown",
  "keyup",
];

export const useKeyModifier: UseKeyModifier = (
  modifier: KeyModifier,
  options: UseModifierOptions = defaultOptions,
): boolean => {
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
};
