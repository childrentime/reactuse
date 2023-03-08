import { BasicTarget, useLatestElement } from "./utils/domTarget";
import useScroll, { UseScrollOptions } from "./useScroll";
import useLatest from "./useLatest";
import useUpdateEffect from "./useUpdateEffect";

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
  options: UseInfiniteScrollOptions = {}
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
  const latestOptions = useLatest(options);

  const di = state[3][direction];

  useUpdateEffect(() => {
    const opts = latestOptions.current;
    const fn = async () => {
      const previous = {
        height: element.current?.scrollHeight ?? 0,
        width: element.current?.scrollWidth ?? 0,
      };

      await savedLoadMore.current(state);

      if (opts.preserveScrollPosition && element.current) {
        element.current.scrollTo({
          top: element.current.scrollHeight - previous.height,
          left: element.current.scrollWidth - previous.width,
        });
      }
    };
    fn();
  }, [di]);
}
