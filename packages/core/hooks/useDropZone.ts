import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { useRef, useState } from "react";
import useEventListener from "./useEventListener";

export default function useDropZone(
  target: BasicTarget<HTMLElement>,
  onDrop?: (files: File[] | null) => void
): boolean {
  const [over, setOver] = useState(false);
  const counter = useRef(0);

  const element = getTargetElement(target);
  useEventListener<DragEvent>(
    "dragenter",
    (event) => {
      event.preventDefault();
      counter.current += 1;
      setOver(true);
    },
    element
  );
  useEventListener<DragEvent>(
    "dragover",
    (event) => {
      event.preventDefault();
    },
    element
  );
  useEventListener<DragEvent>(
    "dragleave",
    (event) => {
      event.preventDefault();
      counter.current -= 1;
      if (counter.current === 0) {
        setOver(false);
      }
    },
    element
  );
  useEventListener<DragEvent>(
    "drop",
    (event) => {
      event.preventDefault();
      counter.current = 0;
      setOver(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      onDrop?.(files.length === 0 ? null : files);
    },
    element
  );

  return over;
}
