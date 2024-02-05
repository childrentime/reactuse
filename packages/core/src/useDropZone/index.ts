import type { RefObject } from "react";
import { useRef, useState } from "react";
import { useEventListener } from "../useEventListener";
import type { UseDropZone } from "./interface";

export const useDropZone: UseDropZone = (
  target: RefObject<EventTarget>,
  onDrop?: (files: File[] | null) => void,
): boolean => {
  const [over, setOver] = useState(false);
  const counter = useRef(0);

  useEventListener(
    "dragenter",
    (event) => {
      event.preventDefault();
      counter.current += 1;
      setOver(true);
    },
    target,
  );
  useEventListener(
    "dragover",
    (event) => {
      event.preventDefault();
    },
    target,
  );
  useEventListener(
    "dragleave",
    (event) => {
      event.preventDefault();
      counter.current -= 1;
      if (counter.current === 0) {
        setOver(false);
      }
    },
    target,
  );
  useEventListener(
    "drop",
    (event: DragEvent) => {
      event.preventDefault();
      counter.current = 0;
      setOver(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      onDrop?.(files.length === 0 ? null : files);
    },
    target,
  );

  return over;
};
