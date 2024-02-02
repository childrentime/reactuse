import type { RefObject } from "react";
import { useEffect, useState } from "react";
import type { PointerType, Position } from "../utils/types";
import useEventListener from "../useEventListener";
import type { UseDraggableOptions } from "./interface";

export const useDraggable = (
  target: RefObject<HTMLElement | SVGElement>,
  options: UseDraggableOptions = {},
): readonly [number, number, boolean] => {
  const draggingElement = options.draggingElement;
  const draggingHandle = options.handle ?? target;

  const [position, setPositon] = useState<Position>(
    options.initialValue ?? { x: 0, y: 0 },
  );

  useEffect(() => {
    setPositon(options.initialValue ?? { x: 0, y: 0 });
  }, [options.initialValue]);

  const [pressedDelta, setPressedDelta] = useState<Position>();

  const filterEvent = (e: PointerEvent) => {
    if (options.pointerTypes) {
      return options.pointerTypes.includes(e.pointerType as PointerType);
    }
    return true;
  };

  const handleEvent = (e: PointerEvent) => {
    if (options.preventDefault) {
      e.preventDefault();
    }
    if (options.stopPropagation) {
      e.stopPropagation();
    }
  };

  const start = (e: PointerEvent) => {
    const element = target.current;
    if (!filterEvent(e) || !element) {
      return;
    }
    if (options.exact && e.target !== element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const pos = {
      x: e.pageX - rect.left,
      y: e.pageY - rect.top,
    };
    if (options.onStart?.(pos, e) === false) {
      return;
    }
    setPressedDelta(pos);
    handleEvent(e);
  };

  const move = (e: PointerEvent) => {
    if (!filterEvent(e)) {
      return;
    }
    if (!pressedDelta) {
      return;
    }
    setPositon({
      x: e.pageX - pressedDelta.x,
      y: e.pageY - pressedDelta.y,
    });
    options.onMove?.(position, e);
    handleEvent(e);
  };

  const end = (e: PointerEvent) => {
    if (!filterEvent(e)) {
      return;
    }
    if (!pressedDelta) {
      return;
    }
    setPressedDelta(undefined);
    options.onEnd?.(position, e);
    handleEvent(e);
  };

  useEventListener("pointerdown", start, draggingHandle, true);
  useEventListener("pointermove", move, draggingElement, true);
  useEventListener("pointerup", end, draggingElement, true);

  return [position.x, position.y, !!pressedDelta] as const;
};
