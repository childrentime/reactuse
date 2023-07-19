import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import type { UseScrollOptions } from "../useScroll";
import useScroll from "../useScroll";
import useLatest from "../useLatest";
import useUpdateEffect from "../useUpdateEffect";
import { defaultOptions } from "../utils/defaults";

export interface UseInfiniteScrollOptions extends UseScrollOptions {
  /**
   * The minimum distance between the bottom of the element and the bottom of the viewport
   *
   * @default 0
   */
  distance?: number;

  /**
   * The direction in which to listen the scroll.
   *
   * @default 'bottom'
   */
  direction?: "top" | "bottom" | "left" | "right";

  /**
   * Whether to preserve the current scroll position when loading more items.
   *
   * @default false
   */
  preserveScrollPosition?: boolean;
}

export default function useInfiniteScroll(
  target: BasicTarget<HTMLElement | SVGElement>,
  onLoadMore: (state: ReturnType<typeof useScroll>) => void | Promise<void>,
  options: UseInfiniteScrollOptions = defaultOptions
) {
  const savedLoadMore = useLatest(onLoadMore);
  const direction = options.direction ?? "bottom";
  const state = useScroll(target, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  });
  const element = useLatestElement(target);

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
}
