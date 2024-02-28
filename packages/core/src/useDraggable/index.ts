import type { RefObject } from "react";
import { useState } from "react";
import type { PointerType, Position } from "../utils/types";
import { useEventListener } from "../useEventListener";
import { useDeepCompareEffect } from "../useDeepCompareEffect";
import type { UseDraggable, UseDraggableOptions } from "./interface";

const isScrollX = (node: Element | null) => {
  if (!node) {
    return false;
  }

  return (
    getComputedStyle(node).overflowX === "auto"
    || getComputedStyle(node).overflowX === "scroll"
  );
};

const isScrollY = (node: Element | null) => {
  if (!node) {
    return false;
  }

  return (
    getComputedStyle(node).overflowY === "auto"
    || getComputedStyle(node).overflowY === "scroll"
  );
};

export const useDraggable: UseDraggable = (
  target: RefObject<HTMLElement | SVGElement>,
  options: UseDraggableOptions = {},
) => {
  const { draggingElement, containerElement } = options;
  const draggingHandle = options.handle ?? target;

  const [position, setPositon] = useState<Position>(
    options.initialValue ?? { x: 0, y: 0 },
  );

  useDeepCompareEffect(() => {
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

    const container = containerElement?.current;
    const containerRect = container?.getBoundingClientRect?.();
    const targetRect = element.getBoundingClientRect();

    const pos = {
      x:
        e.clientX
        - (container
          ? targetRect.left - containerRect!.left + container.scrollLeft
          : targetRect.left),
      y:
        e.clientY
        - (container
          ? targetRect.top - containerRect!.top + container.scrollTop
          : targetRect.top),
    };
    if (options.onStart?.(pos, e) === false) {
      return;
    }
    setPressedDelta(pos);
    handleEvent(e);
  };

  const move = (e: PointerEvent) => {
    const element = target.current;
    if (!filterEvent(e) || !element) {
      return;
    }
    if (!pressedDelta) {
      return;
    }
    const container = containerElement?.current;
    const targetRect = element.getBoundingClientRect();
    let { x, y } = position;
    x = e.clientX - pressedDelta.x;
    y = e.clientY - pressedDelta.y;

    if (container) {
      const containerWidth = isScrollX(container)
        ? container.scrollWidth
        : container.clientWidth;
      const containerHeight = isScrollY(container)
        ? container.scrollHeight
        : container.clientHeight;
      x = Math.min(Math.max(0, x), containerWidth - targetRect.width);
      y = Math.min(Math.max(0, y), containerHeight - targetRect.height);
    }

    setPositon({
      x,
      y,
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

  return [position.x, position.y, !!pressedDelta, setPositon] as const;
};
