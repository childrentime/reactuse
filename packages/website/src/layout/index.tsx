import type { LazyExoticComponent } from "react";
import {
  Fragment,
  Suspense,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useScrollIntoView } from "@reactuses/core";
import styles from "./style.module.css";

export interface IMenu {
  title: string;
  items: { path: string; title: string }[];
}

export interface IRoute {
  path: string;
  element: LazyExoticComponent<any>;
}
export interface IProps {
  routes?: IRoute[];
  menuGroup: IMenu[];
}
const Layout = (props: IProps) => {
  const { menuGroup, routes } = props;
  const pathname = useLocation().pathname.split("/").pop() || "";

  const [element, setElement] = useState<HTMLElement | null>(null);
  const useScrollIntoViewOptions = useMemo(() => {
    return {
      offset: 60,
      duration: 0,
    };
  }, []);
  const { scrollIntoView } = useScrollIntoView(
    element,
    useScrollIntoViewOptions,
  );
  useEffect(() => {
    const node = document.getElementsByClassName(
      styles.itemSelect,
    )[0] as HTMLElement;
    if (!node) {
      return;
    }
    startTransition(() => {
      setElement(node);
    });
  }, [pathname]);

  useEffect(() => {
    scrollIntoView({ alignment: "center" });
  }, [scrollIntoView]);

  const navigate = useNavigate();

  return (
    <>
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
                          const selected
                          = pathname === item.path ? styles.itemSelect : "";
                          return (
                            <li
                              key={item.path}
                              className={`${styles.item} ${selected}`}
                            >
                              <div
                                className={styles.itemLink}
                                onClick={() => {
                                  startTransition(() => {
                                    navigate(`${item.path}`);
                                  });
                                }}
                              >
                                {item.title}
                              </div>
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
            <section className={styles.content}>
              <Suspense fallback="Loading...">
                <Outlet />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
