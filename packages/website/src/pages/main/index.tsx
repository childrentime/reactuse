import { Fragment, useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useScrollIntoView } from "@reactuses/core";
import NotFound from "../404/";
import { menuGroup, pages } from "../../routes";
import styles from "./style.module.css";

const Main = () => {
  const pathname = useLocation().pathname.substring(1);

  const [element, setElement] = useState<HTMLElement | null>(null);
  const { scrollIntoView } = useScrollIntoView({
    offset: 60,
    targetElement: element,
    duration: 0,
  });
  useEffect(() => {
    const node = document.getElementsByClassName(
      styles.itemSelect,
    )[0] as HTMLElement;
    if (!node) {
      return;
    }
    setElement(node);
  }, [pathname]);

  useEffect(() => {
    scrollIntoView({ alignment: "center" });
  }, [element]);

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
          <section className={styles.content}>
            <Routes>
              {pages.map(page => (
                <Route
                  path={`/${page.page}`}
                  element={<page.element />}
                  key={page.page}
                />
              ),
              )}
              <Route path={"*"} element={<NotFound />} key="404" />
            </Routes>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Main;
