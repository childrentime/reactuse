import loadable from "@loadable/component";

interface Menu {
  title: string;
  items: string[];
}

export const menuGroup: Menu[] = [
  {
    title: "STATE",
    items: [
      "useToggle",
      "usePrevious",
      "useLatest",
      "useFirstMountState",
      "useThrottle",
      "useDebounce",
      "useLocalStorage",
      "useSessionStorage",
      "useRafState",
      "useMountedState",
      "useCounter",
      "useVirtualList",
      "useCycleList",
    ],
  },
  {
    title: "Effects",
    items: [
      "useMount",
      "useUnmount",
      "useUpdateEffect",
      "useUpdateLayoutEffect",
      "useIsomorphicLayoutEffect",
      "useEvent",
      "useInterval",
      "useThrottleFn",
      "useDebounceFn",
      "useUpdate",
      "useTimeout",
      "useTimeoutFn",
      "useEventListener",
      "useRafFn",
      "useEventEmitter",
      "useCustomCompareEffect",
      "useDeepCompareEffect",
    ],
  },
  {
    title: "Element",
    items: [
      "useActiveElement",
      "useClickOutside",
      "useDocumentVisibility",
      "useElementBounding",
      "useElementVisibility",
      "useDraggable",
      "useDropZone",
      "useElementSize",
      "useMutationObserver",
      "useIntersectionObserver",
      "useResizeObserver",
      "useWindowFocus",
      "useWindowScroll",
      "useWindowSize",
      "useFocus",
    ],
  },
  {
    title: "Browser",
    items: [
      "useMediaQuery",
      "usePreferredColorScheme",
      "usePreferredContrast",
      "usePreferredDark",
      "useDarkMode",
      "useFavicon",
      "useTitle",
      "useScriptTag",
      "usePermission",
      "useLongPress",
      "useObjectUrl",
      "useIdle",
      "useMediaDevices",
      "useTextDirection",
      "useMouse",
      "useFps",
      "useGeolocation",
      "useFullscreen",
      "useNetwork",
      "useOnline",
      "useOrientation",
      "usePageLeave",
      "useFileDialog",
      "useScroll",
      "useScrollLock",
      "useInfiniteScroll",
      "useKeyModifier",
      "useMousePressed",
      "useClipboard",
    ],
  },
];

export const pages = menuGroup
  .reduce((pre: string[], cur) => {
    pre.push(...cur.items);
    return pre;
  }, [])
  .map((page) => {
    return {
      component: loadable(() => import(`./components/${page}`)),
      page,
    };
  });

export const routes = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);
