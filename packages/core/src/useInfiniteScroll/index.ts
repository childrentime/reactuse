import type { RefObject } from "react";
import { useScroll } from "../useScroll";
import useLatest from "../useLatest";
import useUpdateEffect from "../useUpdateEffect";
import { defaultOptions } from "../utils/defaults";
import { getTargetElement } from "../utils/domTarget";
import type { UseInfiniteScroll, UseInfiniteScrollOptions } from "./interface";

export const useInfiniteScroll: UseInfiniteScroll = (
  target: RefObject<Element>,
  onLoadMore: (state: ReturnType<typeof useScroll>) => void | Promise<void>,
  options: UseInfiniteScrollOptions = defaultOptions,
) => {
  const savedLoadMore = useLatest(onLoadMore);
  const direction = options.direction ?? "bottom";
  const state = useScroll(target, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  });
  const element = getTargetElement(target);

  const di = state[3][direction];

  useUpdateEffect(() => {
    const fn = async () => {
      const previous = {
        height: element?.scrollHeight ?? 0,
        width: element?.scrollWidth ?? 0,
      };

      await savedLoadMore.current(state);

      if (options.preserveScrollPosition && element) {
        element.scrollTo({
          top: element.scrollHeight - previous.height,
          left: element.scrollWidth - previous.width,
        });
      }
    };
    fn();
  }, [di, options.preserveScrollPosition]);
};
