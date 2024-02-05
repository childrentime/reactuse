import { useState } from "react";
import { useEventListener } from "../useEventListener";

export const usePageLeave = (): boolean => {
  const [isLeft, setIsLeft] = useState(false);

  const handler = (event: MouseEvent) => {
    if (!window)
      return;

    event = event || (window.event as any);
    // @ts-expect-error missing types
    const from = event.relatedTarget || event.toElement;
    setIsLeft(!from);
  };

  useEventListener("mouseout", handler, () => window, { passive: true });
  useEventListener("mouseleave", handler, () => document, { passive: true });
  useEventListener("mouseenter", handler, () => document, { passive: true });

  return isLeft;
};
