import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useElementSize from "./useElementSize";
import useEvent from "./useEvent";

export interface UseVirtualListOptions {
  /**
   * container default height
   *
   * @default 300
   */
  containerHeight?: number;
  /**
   * item height, accept a pixel value or a function that returns the height
   */
  itemHeight: number | ((index: number) => number);
  /**
   * the extra buffer items outside of the view area
   *
   * @default 5
   */
  overscan?: number;
}

export interface UseVirtualListItem<T> {
  data: T;
  index: number;
}

export interface UseVirtualListReturn<T> {
  list: UseVirtualListItem<T>[];
  scrollTo: (index: number) => void;
  containerProps: {
    ref: RefObject<any>;
    onScroll: () => void;
    style: Partial<CSSProperties>;
  };
  wrapperProps: {
    style: {
      width: string;
      height: string;
      marginTop: string;
    };
  };
}

export default function useVirtualList<T = any>(
  list: T[] = [],
  options: UseVirtualListOptions
): UseVirtualListReturn<T> {
  const containerRef = useRef<HTMLElement>(null);
  const [width, height] = useElementSize(containerRef);
  const [currentList, setCurrentList] = useState<UseVirtualListItem<T>[]>([]);
  const { itemHeight, overscan = 5, containerHeight = 300 } = options;
  const state = useRef({ start: 0, end: 10 });

  const getViewCapacity = useCallback(
    (containerHeight: number) => {
      if (typeof itemHeight === "number") {
        return Math.ceil(containerHeight / itemHeight);
      }

      const { start = 0 } = state.current;
      let sum = 0;
      let capacity = 0;
      for (let i = start; i < list.length; i++) {
        const height = itemHeight(i);
        sum += height;
        if (sum >= containerHeight) {
          capacity = i;
          break;
        }
      }
      return capacity - start;
    },
    [itemHeight, list]
  );

  const getOffset = useCallback(
    (scrollTop: number) => {
      if (typeof itemHeight === "number")
        return Math.floor(scrollTop / itemHeight) + 1;

      let sum = 0;
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const height = itemHeight(i);
        sum += height;
        if (sum >= scrollTop) {
          offset = i;
          break;
        }
      }
      return offset + 1;
    },
    [itemHeight, list]
  );

  const calculateRange = useEvent(() => {
    const element = containerRef.current;
    if (element != null) {
      const offset = getOffset(element.scrollTop);
      const viewCapacity = getViewCapacity(element.clientHeight);

      const from = offset - overscan;
      const to = offset + viewCapacity + overscan;
      state.current = {
        start: from < 0 ? 0 : from,
        end: to > list.length ? list.length : to,
      };
      setCurrentList(
        list
          .slice(state.current.start, state.current.end)
          .map((ele, index) => ({
            data: ele,
            index: index + state.current.start,
          }))
      );
    }
  });

  useEffect(() => {
    calculateRange();
  }, [width, height, list, calculateRange]);

  const totalHeight = useMemo(() => {
    if (typeof itemHeight === "number") {
      return list.length * itemHeight;
    }
    return list.reduce((sum, _, index) => sum + itemHeight(index), 0);
  }, [itemHeight, list]);

  const getDistanceTop = useCallback(
    (index: number) => {
      if (typeof itemHeight === "number") {
        const height = index * itemHeight;
        return height;
      }
      const height = list
        .slice(0, index)
        .reduce((sum, _, i) => sum + itemHeight(i), 0);
      return height;
    },
    [itemHeight, list]
  );

  const scrollTo = useEvent((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = getDistanceTop(index);
      calculateRange();
    }
  });

  const offsetTop = useMemo(
    () => getDistanceTop(state.current.start),
    [getDistanceTop]
  );

  const wrapperProps = useMemo(() => {
    return {
      style: {
        width: "100%",
        height: `${totalHeight - offsetTop}px`,
        marginTop: `${offsetTop}px`,
      },
    };
  }, [offsetTop, totalHeight]);

  const containerStyle: Partial<CSSProperties> = useMemo(() => {
    return { overflowY: "auto", height: containerHeight };
  }, [containerHeight]);

  return {
    list: currentList,
    scrollTo,
    containerProps: {
      ref: containerRef,
      onScroll: () => {
        calculateRange();
      },
      style: containerStyle,
    },
    wrapperProps,
  } as const;
}
