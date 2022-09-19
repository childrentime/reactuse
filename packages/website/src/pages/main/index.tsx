import { Fragment, lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import styles from "./style.module.css";
import NotFound from "../404/";

interface Menu {
  title: string;
  items: string[];
}

const menuGroup: Menu[] = [
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
      "useMarkdown",
      "useRafState",
      "useMountedState",
      "useCounter",
      "useVirtualList",
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
    title: "Browser",
    items: [
      "useActiveElement",
      "useMediaQuery",
      "usePreferredColorScheme",
      "usePreferredContrast",
      "usePreferredDark",
      "useDarkMode",
      "useMutationObserver",
      "useIntersectionObserver",
      "useResizeObserver",
      "useElementSize",
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
      "useDocumentVisibility",
      "useDropZone",
      "useFileDialog",
      "useScroll",
      "useScrollLock",
      "useInfiniteScroll",
      "useKeyModifier",
      "useMousePressed",
      "useDraggable",
    ],
  },
];

const pages = menuGroup
  .reduce((pre: string[], cur) => {
    pre.push(...cur.items);
    return pre;
  }, [])
  .map((page) => {
    return { component: lazy(() => import(`../../components/${page}`)), page };
  });

const Main = () => {
  const pathname = useLocation().pathname.substring(1);

  return (
    <div className={styles.main}>
      <div className={styles.row}>
        <div className={styles.col5}>
          <div>
            <section className={styles.menu}>
              <ul className={styles.menuRoot}>
                {menuGroup.map((menu) => {
                  return (
                    <Fragment key={menu.title}>
                      <div className={styles.itemTitle} title={menu.title}>
                        {menu.title}
                      </div>
                      {menu.items.map((item) => {
                        return (
                          <li
                            key={item}
                            className={`${styles.item} ${
                              pathname === item ? styles.itemSelect : ""
                            }`}
                          >
                            <Link to={`/${item}`} className={styles.itemLink}>
                              {item}
                            </Link>
                          </li>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
        <div className={styles.col19}>
          <Suspense fallback={<div>Loading...</div>}>
            <section className={styles.content}>
              <Routes>
                {pages.map((page) => (
                  <Route
                    path={`/${page.page}`}
                    element={<page.component />}
                    key={page.page}
                  />
                ))}
                <Route path={"*"} element={<NotFound />} key="404" />
              </Routes>
            </section>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Main;
